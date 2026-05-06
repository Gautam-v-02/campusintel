const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const pdfParse = require('pdf-parse');
const claudeService = require('../services/claude.service');
const { v4: uuidv4 } = require('uuid');
const { signToken, requireAuth } = require('../middleware/auth.middleware');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// ── Smart keyword-based skill extractor ─────────────────────────────────────
// Multi-signal scoring: frequency + section context + project depth + experience years + proficiency language
// Returns { scores, missing_skills } — scores are genuinely different per skill
function smartSkillExtract(text) {
  const lower = text.toLowerCase();

  const SKILL_DEFS = [
    // Languages
    { key: 'python',      patterns: [/python/g],                                  weight: 1.0 },
    { key: 'javascript',  patterns: [/javascript/g, /\bjs\b/g, /node\.?js/g],     weight: 1.0 },
    { key: 'java',        patterns: [/\bjava\b/g],                                 weight: 1.0 },
    { key: 'cpp',         patterns: [/c\+\+/g, /\bcpp\b/g],                        weight: 1.0 },
    { key: 'typescript',  patterns: [/typescript/g, /\bts\b/g],                    weight: 1.0 },
    { key: 'golang',      patterns: [/\bgolang\b/g, /\bgo lang/g],                 weight: 1.1 },
    { key: 'rust',        patterns: [/\brust\b/g],                                  weight: 1.2 },
    // Frontend/Backend frameworks
    { key: 'react',       patterns: [/\breact\b/g, /react\.js/g, /reactjs/g],      weight: 1.0 },
    { key: 'nodejs',      patterns: [/node\.?js/g, /\bexpress\b/g],                weight: 1.0 },
    { key: 'nextjs',      patterns: [/next\.?js/g],                                 weight: 1.0 },
    { key: 'django',      patterns: [/django/g],                                     weight: 1.0 },
    { key: 'fastapi',     patterns: [/fastapi/g],                                    weight: 1.1 },
    { key: 'spring',      patterns: [/spring boot/g, /\bspring\b/g],                weight: 1.0 },
    // Databases
    { key: 'sql',         patterns: [/\bsql\b/g, /mysql/g, /postgres/g, /sqlite/g], weight: 0.9 },
    { key: 'mongodb',     patterns: [/mongodb/g, /\bmongo\b/g],                      weight: 1.0 },
    { key: 'redis',       patterns: [/redis/g],                                       weight: 1.1 },
    { key: 'dbms',        patterns: [/\bdbms\b/g, /database design/g, /rdbms/g],     weight: 0.9 },
    // CS fundamentals
    { key: 'data_structures', patterns: [/data structure/g, /linked list/g, /binary tree/g, /\bheap\b/g], weight: 0.9 },
    { key: 'algorithms',      patterns: [/algorithm/g, /dynamic programming/g, /\bdp\b/g, /graph traversal/g], weight: 1.0 },
    { key: 'system_design',   patterns: [/system design/g, /distributed system/g, /microservice/g, /scalab/g], weight: 1.2 },
    { key: 'os',              patterns: [/operating system/g, /\blinux\b/g, /\bunix\b/g, /process scheduling/g], weight: 0.8 },
    { key: 'networking',      patterns: [/networking/g, /\btcp\b/g, /\bhttp\b/g, /rest\s*api/g, /grpc/g], weight: 0.9 },
    { key: 'oops',            patterns: [/object.oriented/g, /\boops\b/g, /\boop\b/g, /inheritance/g, /polymorphism/g], weight: 0.8 },
    // Cloud / DevOps
    { key: 'aws',         patterns: [/\baws\b/g, /amazon web service/g, /\bec2\b/g, /\bs3\b/g], weight: 1.1 },
    { key: 'docker',      patterns: [/docker/g, /container/g],                               weight: 1.1 },
    { key: 'kubernetes',  patterns: [/kubernetes/g, /\bk8s\b/g],                             weight: 1.3 },
    { key: 'git',         patterns: [/\bgit\b/g, /github/g, /gitlab/g],                     weight: 0.7 },
    { key: 'ci_cd',       patterns: [/ci\/cd/g, /github actions/g, /jenkins/g, /pipeline/g], weight: 1.1 },
    // ML / AI
    { key: 'machine_learning', patterns: [/machine learning/g, /\bml\b/g, /sklearn/g, /tensorflow/g, /pytorch/g], weight: 1.2 },
    { key: 'deep_learning',    patterns: [/deep learning/g, /neural network/g, /cnn/g, /lstm/g], weight: 1.3 },
  ];


  // ── Context windows for section detection ──────────────────
  const skillsSectionText  = (lower.match(/(skills|technologies|tech stack|technical expertise)[^\n]{0,400}/g) || []).join(' ');
  const projectSectionText = (lower.match(/(project|projects|built|developed|created|implemented)[^\n]{0,400}/g) || []).join(' ');
  const expSectionText     = (lower.match(/(experience|internship|work|employment)[^\n]{0,400}/g) || []).join(' ');

  const scores = {};

  for (const { key, patterns, weight } of SKILL_DEFS) {
    let totalMatches = 0;
    let inSkillsSection  = false;
    let inProjectSection = false;
    let inExpSection     = false;

    for (const pattern of patterns) {
      const gp = new RegExp(pattern.source, 'gi');
      const allMatches = lower.match(gp);
      totalMatches += allMatches ? allMatches.length : 0;
      if (!inSkillsSection  && gp.test(skillsSectionText))  inSkillsSection  = true;
      if (!inProjectSection && gp.test(projectSectionText)) inProjectSection = true;
      if (!inExpSection     && gp.test(expSectionText))     inExpSection     = true;
    }

    if (totalMatches === 0) continue; // skill completely absent

    // Signal 1: Frequency (log scale) — 1 mention→0.35, 3→0.52, 8+→0.70
    let score = Math.min(0.70, 0.28 + (Math.log(totalMatches + 1) / Math.log(10)) * 0.55);

    // Signal 2: Section context (additive, non-stacking beyond 0.15)
    let sectionBoost = 0;
    if (inSkillsSection)  sectionBoost = Math.max(sectionBoost, 0.15); // listed as a skill
    if (inProjectSection) sectionBoost = Math.max(sectionBoost, 0.08); // used in a project
    if (inExpSection)     sectionBoost = Math.max(sectionBoost, 0.05); // mentioned in experience
    score += sectionBoost;

    // Signal 3: Project depth — "built X with Y" / "developed X using Y"
    const depthPattern = new RegExp(
      `(built|developed|created|implemented|designed)\\s+\\w+\\s+(using|with|in|on)\\s+[^.]{0,60}${key.replace(/_/g, '[ _]')}`,
      'i'
    );
    if (depthPattern.test(lower)) score += 0.10; // concretely used in a project

    // Apply skill difficulty weight
    score = score * weight;

    scores[key] = Math.min(0.95, Math.round(score * 100) / 100);
  }

  // ── Signal 4: Experience-year & proficiency language boosts ──
  const boostRules = [
    { regex: /(\d+)\+?\s+years?\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?(\w+)/gi, boost: (m) => Math.min(0.18, 0.06 * parseInt(m[1])) },
    { regex: /expert\s+in\s+(\w+)/gi,          boost: () => 0.18 },
    { regex: /proficient\s+in\s+(\w+)/gi,       boost: () => 0.12 },
    { regex: /strong\s+(?:foundation|knowledge)\s+(?:in|of)\s+(\w+)/gi, boost: () => 0.09 },
    { regex: /familiar\s+with\s+(\w+)/gi,       boost: () => -0.05 }, // downgrade "familiar with"
    { regex: /basic\s+(?:knowledge\s+of\s+)?(\w+)/gi, boost: () => -0.08 }, // downgrade "basic"
  ];

  for (const { regex, boost } of boostRules) {
    const matches = [...lower.matchAll(regex)];
    for (const match of matches) {
      const mentionedSkill = match[match.length - 1]?.toLowerCase() || '';
      for (const key of Object.keys(scores)) {
        if (mentionedSkill && (key.startsWith(mentionedSkill.substring(0, 4)) || mentionedSkill.startsWith(key.substring(0, 4)))) {
          const b = typeof boost === 'function' ? boost(match) : boost;
          scores[key] = Math.max(0.05, Math.min(0.95, scores[key] + b));
          scores[key] = Math.round(scores[key] * 100) / 100;
        }
      }
    }
  }

  // ── Missing skills: all known skills NOT found in the resume ──
  const missing_skills = SKILL_DEFS
    .filter(({ key }) => !(key in scores))
    .map(({ key }) => key);

  console.log(`[SmartExtract] Detected ${Object.keys(scores).length} skills, missing ${missing_skills.length}:`, scores);
  return { scores, missing_skills };
}






/**
 * POST /api/student/register
 * Create a new student account with a hashed password.
 * Body: { name, email, password, collegeId, branch, batchYear, cgpa }
 */
router.post('/register', async (req, res) => {
  const { name, email, password, collegeId = 'college-lpu-001', branch, batchYear, cgpa } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Normalise email
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, name, email, college_id, role, current_state')
    .eq('email', normalizedEmail)
    .single();

  if (existing) {
    return res.status(409).json({
      error: 'An account with this email already exists. Please log in.',
      already_exists: true,
    });
  }

  // Hash password — never store plain-text
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create new user
  const studentId = `student-${uuidv4().slice(0, 8)}`;

  const { data: newUser, error: insertErr } = await supabase
    .from('users')
    .insert({
      id: studentId,
      college_id: collegeId,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'student',
      batch_year: batchYear ? parseInt(batchYear) : null,
      branch: branch || null,
      cgpa: cgpa ? parseFloat(cgpa) : null,
      current_state: 'UNAWARE',
      inferred_skills: {},
      confidence_score: 0.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, name, email, college_id, role, branch, cgpa, batch_year, current_state, confidence_score, inferred_skills, updated_at')
    .single();

  if (insertErr) {
    console.error('[Register] Insert failed:', insertErr.message);
    return res.status(500).json({ error: insertErr.message });
  }

  const token = signToken(newUser);
  console.log(`[Register] ✅ New student created: ${studentId} — ${name} <${normalizedEmail}>`);
  res.json({
    success: true,
    already_exists: false,
    student: newUser,   // password_hash is NOT selected, so it's never sent to client
    token,
    message: 'Account created successfully!',
  });
});

/**
 * POST /api/student/login
 * Verifies email + password (bcrypt) and returns a JWT.
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Fetch user including password_hash for verification
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, college_id, role, branch, cgpa, batch_year, current_state, confidence_score, inferred_skills, updated_at, password_hash')
    .eq('email', normalizedEmail)
    .single();

  if (error || !user) {
    return res.status(404).json({
      error: 'No account found with that email. Please register first.',
      not_found: true,
    });
  }

  // Legacy accounts (seeded before password auth) have no hash — must be reset
  if (!user.password_hash) {
    return res.status(401).json({
      error: 'This account has no password set. Please contact your TPC admin to reset it.',
      no_password: true,
    });
  }

  // Verify password against stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  // Strip password_hash before sending to client
  const { password_hash, ...safeUser } = user;

  const token = signToken(safeUser);
  console.log(`[Login] ✅ ${safeUser.name} signed in (${safeUser.id})`);
  res.json({
    success: true,
    student: safeUser,
    token,
    message: `Welcome back, ${safeUser.name}!`,
  });
});

/**
 * GET /api/student/:studentId/registrations
 * Returns all drive registrations for a student (with drive + company info)
 */
router.get('/:studentId/registrations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .select(`
        id, status, registered_at, current_round,
        drive:campus_drives(
          id, drive_date, registration_deadline, roles_offered,
          package_offered, status,
          company:companies(id, name, normalized_name, website)
        )
      `)
      .eq('student_id', req.params.studentId)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[Student] registrations fetch failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/student/upload-resume
 * Accepts a PDF as base64, extracts text, infers skills via Gemini,
 * saves to user's inferred_skills + resume_text.
 * Body: { studentId, pdfBase64 }
 */
router.post('/upload-resume', async (req, res) => {
  const { studentId = 'demo-student-rahul', pdfBase64 } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ error: 'pdfBase64 is required.' });
  }

  let resumeText = '';
  try {
    const buffer = Buffer.from(pdfBase64, 'base64');
    const parsed = await pdfParse(buffer);
    resumeText = parsed.text?.trim() || '';
  } catch (parseErr) {
    console.error('[Resume] PDF parse failed:', parseErr.message);
    return res.status(400).json({ error: 'Could not parse PDF. Make sure it is a valid PDF file.' });
  }

  if (!resumeText || resumeText.length < 100) {
    return res.status(400).json({ error: 'PDF appears to be empty or unreadable (image-based PDF?).' });
  }

  // Extract skills via Gemini
  let inferredSkills = {};
  let missingSkills  = [];

  try {
    const systemPrompt = `You are a technical recruiter. Extract skills from a student's resume.
Return ONLY valid JSON no markdown. Start directly with {`;

    const userMessage = `
Resume text:
${resumeText.substring(0, 3000)}

Return a flat JSON object where keys are skill names (lowercase_underscore) 
and values are proficiency from 0.0 to 1.0.
Focus on: programming languages, frameworks, CS topics (data structures, algorithms, system design, dbms, os, networks), tools.

Example output:
{
  "python": 0.85,
  "javascript": 0.70,
  "system_design": 0.30,
  "arrays": 0.75,
  "dbms": 0.60,
  "react": 0.65
}`;

    const raw = claudeService.callWithFallback
      ? await claudeService.callWithFallback(systemPrompt, userMessage, 400, {})
      : null;

    if (raw) {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      inferredSkills = JSON.parse(cleaned);
    }
  } catch (skillErr) {
    console.warn('[Resume] Skill extraction failed, using smart keyword fallback:', skillErr.message);
    const fallback = smartSkillExtract(resumeText);
    inferredSkills = fallback.scores;
    missingSkills  = fallback.missing_skills;
  }

  // If Gemini returned something but it parsed to empty object, also run smart fallback
  if (Object.keys(inferredSkills).length === 0) {
    console.warn('[Resume] Gemini returned empty skills, using smart keyword fallback');
    const fallback = smartSkillExtract(resumeText);
    inferredSkills = fallback.scores;
    missingSkills  = fallback.missing_skills;
  }

  // Save to Supabase
  const { error: updateError } = await supabase
    .from('users')
    .update({
      resume_text: resumeText.substring(0, 10000),
      inferred_skills: inferredSkills,
      current_state: 'PROFILED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  if (updateError) {
    console.error('[Resume] Supabase update failed:', updateError.message);
    return res.status(500).json({ error: updateError.message });
  }

  const skillCount = Object.keys(inferredSkills).length;
  console.log(`[Resume] ✅ Parsed resume for ${studentId}. Extracted ${skillCount} skills, missing ${missingSkills.length}.`);

  res.json({
    success: true,
    student_id: studentId,
    skills_extracted: skillCount,
    inferred_skills: inferredSkills,
    missing_skills: missingSkills,   // skills NOT found in the resume at all
    resume_preview: resumeText.substring(0, 300) + '...',
    message: `Resume parsed! ${skillCount} skills found. ${missingSkills.length} skills not detected in your resume.`,
  });
});

/**
 * GET /api/student/:studentId
 * Fetch student profile (requires auth — students can only view their own)
 */
router.get('/:studentId', requireAuth, async (req, res) => {
  // Students can only fetch their own profile unless they are TPC admin
  const requestedId = req.params.studentId;
  const callerId = req.user?.id;
  const callerRole = req.user?.role;

  if (callerId !== requestedId && callerRole !== 'tpc_admin' && callerRole !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, branch, cgpa, batch_year, college_id, current_state, confidence_score, inferred_skills, resume_text, updated_at')
    .eq('id', requestedId)
    .single();

  if (error) return res.status(404).json({ error: 'Student not found.' });
  res.json({ ...data, resume_text: data?.resume_text ? '[Resume on file]' : null });
});

module.exports = router;
