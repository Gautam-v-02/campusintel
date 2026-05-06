'use client';
import { useState, useEffect } from 'react';
import { getStudent } from '@/lib/auth';
import Link from 'next/link';

// ── All known skills the system tracks ─────────────────────────
const ALL_SKILLS = [
  'python','javascript','java','cpp','typescript','golang','rust',
  'react','nodejs','nextjs','django','fastapi','spring',
  'sql','mongodb','redis','dbms',
  'data_structures','algorithms','system_design','os','networking','oops',
  'aws','docker','kubernetes','git','ci_cd',
  'machine_learning','deep_learning',
];

// ── Category grouping ───────────────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
  '💻 Languages':         ['python','javascript','java','cpp','typescript','golang','rust'],
  '🧩 Frameworks':        ['react','nodejs','nextjs','django','fastapi','spring'],
  '🗄️ Databases':         ['sql','mongodb','redis','dbms'],
  '🧠 CS Fundamentals':   ['data_structures','algorithms','system_design','os','networking','oops'],
  '☁️ Cloud & DevOps':    ['aws','docker','kubernetes','git','ci_cd'],
  '🤖 AI / ML':           ['machine_learning','deep_learning'],
};

// ── Revision resources for each skill ──────────────────────────
const RESOURCES: Record<string, { label: string; url: string }[]> = {
  python:           [{ label: 'Python Docs',           url: 'https://docs.python.org/3/tutorial/' },         { label: 'LeetCode Python',       url: 'https://leetcode.com/tag/python/' }],
  javascript:       [{ label: 'MDN JS Guide',          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' }, { label: 'JS.info',           url: 'https://javascript.info/' }],
  java:             [{ label: 'Java Docs',              url: 'https://docs.oracle.com/javase/tutorial/' },    { label: 'Baeldung Java',         url: 'https://www.baeldung.com/' }],
  cpp:              [{ label: 'CPP Reference',          url: 'https://en.cppreference.com/' },               { label: 'GeeksForGeeks C++',     url: 'https://www.geeksforgeeks.org/c-plus-plus/' }],
  typescript:       [{ label: 'TS Handbook',            url: 'https://www.typescriptlang.org/docs/handbook/' }, { label: 'TS Playground',       url: 'https://www.typescriptlang.org/play' }],
  golang:           [{ label: 'Go Tour',                url: 'https://go.dev/tour/' },                       { label: 'Go By Example',         url: 'https://gobyexample.com/' }],
  rust:             [{ label: 'Rust Book',              url: 'https://doc.rust-lang.org/book/' },             { label: 'Rustlings',             url: 'https://github.com/rust-lang/rustlings' }],
  react:            [{ label: 'React Docs',             url: 'https://react.dev/' },                         { label: 'React Patterns',        url: 'https://reactpatterns.com/' }],
  nodejs:           [{ label: 'Node.js Docs',           url: 'https://nodejs.org/docs/latest/api/' },        { label: 'Node Best Practices',   url: 'https://github.com/goldbergyoni/nodebestpractices' }],
  nextjs:           [{ label: 'Next.js Docs',           url: 'https://nextjs.org/docs' },                    { label: 'Next.js Examples',      url: 'https://github.com/vercel/next.js/tree/canary/examples' }],
  django:           [{ label: 'Django Docs',            url: 'https://docs.djangoproject.com/' },            { label: 'Django Tutorial',       url: 'https://tutorial.djangogirls.org/' }],
  fastapi:          [{ label: 'FastAPI Docs',           url: 'https://fastapi.tiangolo.com/' },              { label: 'FastAPI Tutorial',      url: 'https://fastapi.tiangolo.com/tutorial/' }],
  spring:           [{ label: 'Spring Guides',          url: 'https://spring.io/guides' },                   { label: 'Baeldung Spring',       url: 'https://www.baeldung.com/spring-tutorial' }],
  sql:              [{ label: 'SQLZoo',                 url: 'https://sqlzoo.net/' },                        { label: 'Mode SQL Tutorial',     url: 'https://mode.com/sql-tutorial/' }],
  mongodb:          [{ label: 'MongoDB University',     url: 'https://university.mongodb.com/' },            { label: 'MongoDB Docs',          url: 'https://www.mongodb.com/docs/' }],
  redis:            [{ label: 'Redis University',       url: 'https://university.redis.com/' },              { label: 'Redis Commands',        url: 'https://redis.io/commands/' }],
  dbms:             [{ label: 'DBMS Notes (GFG)',       url: 'https://www.geeksforgeeks.org/dbms/' },        { label: 'CMU DB Course',         url: 'https://15445.courses.cs.cmu.edu/' }],
  data_structures:  [{ label: 'Visualgo DS',            url: 'https://visualgo.net/' },                      { label: 'LeetCode DS',           url: 'https://leetcode.com/explore/learn/' }],
  algorithms:       [{ label: 'CP Algorithms',          url: 'https://cp-algorithms.com/' },                 { label: 'NeetCode 150',          url: 'https://neetcode.io/' }],
  system_design:    [{ label: 'System Design Primer',   url: 'https://github.com/donnemartin/system-design-primer' }, { label: 'Grokking SD',  url: 'https://www.designgurus.io/course/grokking-the-system-design-interview' }],
  os:               [{ label: 'OSTEP Book',             url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/' },   { label: 'OS Notes (GFG)',        url: 'https://www.geeksforgeeks.org/operating-systems/' }],
  networking:       [{ label: 'Computer Networks (GFG)',url: 'https://www.geeksforgeeks.org/computer-network-tutorials/' }, { label: 'Beej Networking', url: 'https://beej.us/guide/bgnet/' }],
  oops:             [{ label: 'OOP Concepts (GFG)',     url: 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/' }, { label: 'Design Patterns', url: 'https://refactoring.guru/design-patterns' }],
  aws:              [{ label: 'AWS Free Training',      url: 'https://aws.amazon.com/training/digital/' },   { label: 'AWS Docs',              url: 'https://docs.aws.amazon.com/' }],
  docker:           [{ label: 'Docker Docs',            url: 'https://docs.docker.com/get-started/' },       { label: 'Play with Docker',      url: 'https://labs.play-with-docker.com/' }],
  kubernetes:       [{ label: 'K8s Docs',               url: 'https://kubernetes.io/docs/tutorials/' },      { label: 'K8s by Example',        url: 'https://kubernetesbyexample.com/' }],
  git:              [{ label: 'Git Docs',               url: 'https://git-scm.com/doc' },                   { label: 'Oh My Git',             url: 'https://ohmygit.org/' }],
  ci_cd:            [{ label: 'GitHub Actions Docs',   url: 'https://docs.github.com/en/actions' },         { label: 'Jenkins Tutorial',      url: 'https://www.jenkins.io/doc/tutorials/' }],
  machine_learning: [{ label: 'ML Course (Andrew Ng)', url: 'https://www.coursera.org/learn/machine-learning' }, { label: 'Kaggle Learn',    url: 'https://www.kaggle.com/learn' }],
  deep_learning:    [{ label: 'Fast.ai',                url: 'https://www.fast.ai/' },                       { label: 'Deep Learning Book',    url: 'https://www.deeplearningbook.org/' }],
};

// ── Status helpers ──────────────────────────────────────────────
function getStatus(level: number | null): 'MISSING' | 'CRITICAL' | 'MODERATE' | 'GOOD' {
  if (level === null) return 'MISSING';
  if (level < 0.35)   return 'CRITICAL';
  if (level < 0.65)   return 'MODERATE';
  return 'GOOD';
}

const STATUS_META = {
  MISSING:  { label: 'Not in Resume', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.25)', bar: '#6b7280',  icon: '○' },
  CRITICAL: { label: 'Weak — Revise Now', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.3)', bar: '#f59e0b', icon: '⚠' },
  MODERATE: { label: 'Moderate', color: '#6366f1', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)', bar: '#6366f1',         icon: '◑' },
  GOOD:     { label: 'Good', color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', bar: '#10b981',             icon: '✓' },
};

// ── Skill Card ──────────────────────────────────────────────────
function SkillCard({ skill, level, expanded, onToggle }: {
  skill: string; level: number | null;
  expanded: boolean; onToggle: () => void;
}) {
  const status  = getStatus(level);
  const meta    = STATUS_META[status];
  const display = skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const pct     = level !== null ? Math.round(level * 100) : 0;
  const links   = RESOURCES[skill] || [];

  return (
    <div
      onClick={onToggle}
      className="rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
      style={{ background: expanded ? meta.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${expanded ? meta.border : '#2a2a3d'}` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-base w-5 text-center flex-shrink-0" style={{ color: meta.color }}>{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-medium text-[#e8e6f8]">{display}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
              {meta.label}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-[#2a2a3d] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: meta.bar }} />
          </div>
        </div>
        <span className="text-xs font-mono text-[#6b7280] flex-shrink-0 w-8 text-right">
          {level !== null ? `${pct}%` : '—'}
        </span>
        <span className="text-[#4b4b6b] text-xs ml-1">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded: resources */}
      {expanded && links.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#2a2a3d] space-y-2" onClick={e => e.stopPropagation()}>
          <p className="text-[11px] uppercase tracking-widest text-[#6b7280] font-semibold mb-2">📚 Revision Resources</p>
          <div className="flex flex-wrap gap-2">
            {links.map(r => (
              <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition hover:brightness-125"
                style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                {r.label} ↗
              </a>
            ))}
          </div>
          {status === 'CRITICAL' && (
            <div className="mt-3 p-3 rounded-lg text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20">
              ⚡ <strong>Priority Alert:</strong> This skill is below 35% — companies frequently test this. Aim to revise before your next drive.
            </div>
          )}
          {status === 'MISSING' && (
            <div className="mt-3 p-3 rounded-lg text-xs text-[#9b9bbb] bg-[#2a2a3d]/60 border border-[#3a3a4d]">
              📄 This skill was <strong>not detected</strong> in your resume. If you know it, add it to your CV. If not, start with the resources above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function RevisionPage() {
  const [skills, setSkills] = useState<Record<string, number | null>>({});
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'GOOD' | 'MISSING'>('ALL');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const stored = getStudent();
    const inferred: Record<string, number> = stored?.inferred_skills || {};
    // Build full skill map: known score or null (missing)
    const fullMap: Record<string, number | null> = {};
    for (const s of ALL_SKILLS) {
      fullMap[s] = s in inferred ? inferred[s] : null;
    }
    setSkills(fullMap);
  }, []);

  // ── Counts for filter pills ──────────────────────────────────
  const counts = {
    ALL:      ALL_SKILLS.length,
    CRITICAL: ALL_SKILLS.filter(s => getStatus(skills[s] ?? null) === 'CRITICAL').length,
    MODERATE: ALL_SKILLS.filter(s => getStatus(skills[s] ?? null) === 'MODERATE').length,
    GOOD:     ALL_SKILLS.filter(s => getStatus(skills[s] ?? null) === 'GOOD').length,
    MISSING:  ALL_SKILLS.filter(s => getStatus(skills[s] ?? null) === 'MISSING').length,
  };

  const weakCount    = counts.CRITICAL;
  const missingCount = counts.MISSING;

  // ── Filtered + searched skills ────────────────────────────────
  const filtered = ALL_SKILLS.filter(s => {
    const status = getStatus(skills[s] ?? null);
    const matchesFilter = filter === 'ALL' || status === filter;
    const matchesSearch = s.includes(search.toLowerCase()) || s.replace(/_/g,' ').includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const FILTERS: ('ALL' | 'CRITICAL' | 'MODERATE' | 'GOOD' | 'MISSING')[] = ['ALL','CRITICAL','MODERATE','GOOD','MISSING'];
  const FILTER_LABELS = { ALL: 'All', CRITICAL: '⚠ Weak', MODERATE: '◑ Moderate', GOOD: '✓ Good', MISSING: '○ Missing' };
  const FILTER_COLORS: Record<string, string> = {
    ALL: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10',
    CRITICAL: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    MODERATE: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10',
    GOOD: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    MISSING: 'border-[#4b4b6b] text-[#9b9bbb] bg-[#2a2a3d]/60',
  };

  return (
    <div className="relative min-h-screen p-6 md:p-8">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-[1000px] mx-auto relative z-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-[#e8e6f8]">📖 Revision Topics</h1>
            <p className="text-[#6b7280] text-sm mt-1">
              Your personalised skill map — every topic scored from your resume
            </p>
          </div>
          <Link href="/dashboard" className="text-xs text-indigo-400 hover:text-indigo-300 transition mt-1">
            ← Dashboard
          </Link>
        </div>

        {/* Alert banners */}
        {weakCount > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <span className="font-semibold">You have {weakCount} weak skill{weakCount > 1 ? 's' : ''}</span> scoring below 35%.
              Companies frequently test these topics. Click each to see revision resources.
            </div>
          </div>
        )}
        {missingCount > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[#2a2a3d]/80 border border-[#3a3a4d] text-[#9b9bbb] text-sm">
            <span className="text-xl flex-shrink-0">📄</span>
            <div>
              <span className="font-semibold text-[#c4c4d8]">{missingCount} skills were not found in your resume</span> — either add them to your CV if you know them, or start learning them.
            </div>
          </div>
        )}

        {/* Summary pills */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Skills', value: counts.ALL, color: '#6366f1' },
            { label: 'Weak (< 35%)', value: counts.CRITICAL, color: '#f59e0b' },
            { label: 'Moderate', value: counts.MODERATE, color: '#6366f1' },
            { label: 'Not in Resume', value: counts.MISSING, color: '#6b7280' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 bg-white/[0.02] border border-[#2a2a3d] text-center">
              <div className="font-display text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-[#6b7280] mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="flex-1 h-10 rounded-xl bg-[#0f0f1a] border border-[#2a2a3d] px-4 text-[#e8e6f8] placeholder:text-[#4b4b6b] text-sm outline-none focus:border-indigo-500/60 transition"
          />
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                  filter === f ? FILTER_COLORS[f] : 'border-[#2a2a3d] text-[#6b7280] hover:text-[#9b9bbb]'
                }`}>
                {FILTER_LABELS[f]} <span className="opacity-60">({counts[f]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skills by category */}
        {Object.entries(CATEGORIES).map(([cat, catSkills]) => {
          const visible = catSkills.filter(s => filtered.includes(s));
          if (visible.length === 0) return null;
          return (
            <div key={cat}>
              <div className="text-[11px] uppercase tracking-widest text-[#6b7280] font-semibold mb-3">{cat}</div>
              <div className="space-y-2">
                {visible.map(skill => (
                  <SkillCard
                    key={skill}
                    skill={skill}
                    level={skills[skill] ?? null}
                    expanded={expanded === skill}
                    onToggle={() => setExpanded(expanded === skill ? null : skill)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#4b4b6b] text-sm">
            No skills match your filter. <button onClick={() => { setFilter('ALL'); setSearch(''); }} className="text-indigo-400 hover:text-indigo-300 transition">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
