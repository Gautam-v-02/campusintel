const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const pdfParse = require('pdf-parse');
const claudeService = require('../services/claude.service');

/**
 * POST /api/student/upload-resume
 * Accepts a PDF as base64 or raw buffer, extracts text, infers skills via Gemini,
 * saves to user's inferred_skills + resume_text.
 * 
 * Body: { studentId, pdfBase64 } OR multipart form-data with 'resume' file
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

    const raw = await claudeService.callWithFallback
      ? await claudeService.callWithFallback(systemPrompt, userMessage, 400, {})
      : null;

    if (raw) {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      inferredSkills = JSON.parse(cleaned);
    }
  } catch (skillErr) {
    console.warn('[Resume] Skill extraction failed, using keyword fallback:', skillErr.message);
    // Basic keyword fallback
    const keywords = {
      python: /python/i, javascript: /javascript|js/i, java: /\bjava\b/i,
      cpp: /c\+\+|cpp/i, react: /react/i, nodejs: /node\.?js/i,
      sql: /sql|mysql|postgres/i, system_design: /system design/i,
      arrays: /array|linked list|data structure/i, dbms: /dbms|database/i,
      os: /operating system|\bos\b/i, networking: /network|tcp|http/i,
    };
    for (const [skill, regex] of Object.entries(keywords)) {
      if (regex.test(resumeText)) inferredSkills[skill] = 0.6;
    }
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
  console.log(`[Resume] ✅ Parsed resume for ${studentId}. Extracted ${skillCount} skills.`);

  res.json({
    success: true,
    student_id: studentId,
    skills_extracted: skillCount,
    inferred_skills: inferredSkills,
    resume_preview: resumeText.substring(0, 300) + '...',
    message: `Resume parsed! ${skillCount} skills extracted and saved to your profile.`,
  });
});

/**
 * GET /api/student/:studentId
 * Fetch student profile
 */
router.get('/:studentId', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, branch, current_state, confidence_score, inferred_skills, resume_text, updated_at')
    .eq('id', req.params.studentId)
    .single();

  if (error) return res.status(404).json({ error: 'Student not found.' });
  // Don't send full resume text in this response
  res.json({ ...data, resume_text: data?.resume_text ? '[Resume on file]' : null });
});

module.exports = router;
