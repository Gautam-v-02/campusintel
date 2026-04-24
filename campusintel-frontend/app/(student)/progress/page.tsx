'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getStudent } from '@/lib/auth';

const STATE_ORDER = ['UNAWARE', 'PROFILED', 'TARGETED', 'ASSESSED', 'PREPARING', 'INTERVIEW_READY', 'POST_INTERVIEW'];
const STATE_LABELS: Record<string, string> = {
  UNAWARE: 'Profile Created',
  PROFILED: 'Skills Assessed',
  TARGETED: 'First Brief Delivered',
  ASSESSED: 'Assessment Complete',
  PREPARING: 'Preparation Active',
  INTERVIEW_READY: 'Interview Ready',
  POST_INTERVIEW: 'Post-Interview',
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#2a2a3d] rounded-lg ${className}`} />;
}

export default function ProgressPage() {
  const [student, setStudentData] = useState<any>(null);
  const [briefCount, setBriefCount] = useState(0);
  const [debriefCount, setDebriefCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = getStudent();
      if (!stored?.id) return;

      try {
        const [studentRes, briefRes] = await Promise.allSettled([
          api.getStudent(stored.id),
          api.getBrief(stored.id),
        ]);

        if (studentRes.status === 'fulfilled' && !studentRes.value.error) {
          setStudentData(studentRes.value);
        } else {
          setStudentData(stored);
        }

        if (briefRes.status === 'fulfilled' && Array.isArray(briefRes.value)) {
          setBriefCount(briefRes.value.length);
        }

        // Count debriefs from the college intel
        try {
          const debriefs = await api.getDebriefs(stored.college_id || 'college-lpu-001', 'company-google-001');
          const list = Array.isArray(debriefs) ? debriefs : [];
          // Count this student's debriefs
          setDebriefCount(list.filter((d: any) => d.student_id === stored.id).length || 0);
        } catch {}
      } catch (err) {
        console.error('[Progress] Load failed:', err);
        setStudentData(stored);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentState = student?.current_state || 'UNAWARE';
  const currentIndex = STATE_ORDER.indexOf(currentState);
  const score = student?.confidence_score || 0;

  const skills = student?.inferred_skills
    ? Object.entries(student.inferred_skills as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  return (
    <div className="p-8 max-w-[900px] mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl text-[#e8e6f8]">My Progress</h1>
        <p className="text-[#6b7280] text-sm mt-1">
          {student?.name ? `${student.name}'s placement readiness journey` : 'Your placement readiness journey'}
        </p>
      </div>

      {/* State machine progress */}
      <div className="card-dark rounded-2xl p-6">
        <div className="text-[11px] uppercase tracking-widest text-[#6b7280] font-semibold mb-6">Placement Journey</div>
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex items-start gap-0">
            {STATE_ORDER.map((state, i) => {
              const done = i <= currentIndex;
              const isCurrent = state === currentState;
              return (
                <div key={state} className="flex-1 flex flex-col items-center relative">
                  {i < STATE_ORDER.length - 1 && (
                    <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${done ? 'bg-indigo-500' : 'bg-[#2a2a3d]'}`} />
                  )}
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done ? 'bg-indigo-600 border-indigo-400 text-white' :
                    isCurrent ? 'bg-indigo-600/50 border-indigo-400 text-indigo-200 animate-pulse' :
                    'bg-[#0f0f1a] border-[#3a3a4d] text-[#4b4b6b]'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div className="mt-3 text-center px-1">
                    <div className={`text-[10px] font-semibold ${done ? 'text-indigo-300' : 'text-[#4b4b6b]'}`}>
                      {STATE_LABELS[state] || state}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills breakdown */}
      <div className="card-dark rounded-2xl p-6">
        <div className="text-[11px] uppercase tracking-widest text-[#6b7280] font-semibold mb-6">
          Readiness Score: <span className="text-indigo-400">{loading ? '—' : score.toFixed(2)}</span>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        ) : skills.length > 0 ? (
          <div className="space-y-3">
            {skills.map(([name, level]) => {
              const pct = (level as number) * 100;
              const color = pct < 30 ? '#f59e0b' : pct < 60 ? '#6366f1' : '#10b981';
              const status = pct < 30 ? 'CRITICAL' : pct < 60 ? 'MODERATE' : 'STRONG';
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-[#9b9bbb] w-28 flex-shrink-0 capitalize">
                    {name.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 h-2 bg-[#2a2a3d] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[10px] font-bold w-10 text-right" style={{ color }}>
                    {pct.toFixed(0)}%
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    status === 'CRITICAL' ? 'bg-amber-500/15 text-amber-400' :
                    status === 'MODERATE' ? 'bg-indigo-500/15 text-indigo-400' :
                    'bg-emerald-500/15 text-emerald-400'
                  }`}>{status}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#4b4b6b] text-sm">
            <p>No skills detected yet.</p>
            <a href="/demo" className="text-indigo-400 hover:text-indigo-300 text-xs mt-2 block">
              Upload your resume or run the agent to get started →
            </a>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Briefs Received', value: loading ? '—' : String(briefCount), icon: '📋' },
          { label: 'Current State', value: loading ? '—' : currentState.replace(/_/g, ' '), icon: '🎯' },
          { label: 'Debriefs Shared', value: loading ? '—' : String(debriefCount), icon: '🤝' },
        ].map(s => (
          <div key={s.label} className="card-dark rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#6b7280]">{s.label}</div>
              <div className="font-display text-2xl text-[#e8e6f8]">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
