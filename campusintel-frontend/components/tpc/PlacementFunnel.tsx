'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

const PIPELINE_STATES = [
  { key: 'UNAWARE',        label: 'Unaware',        color: '#6b7280', glow: 'rgba(107,114,128,0.4)', icon: '👤' },
  { key: 'PROFILED',       label: 'Profiled',        color: '#3b82f6', glow: 'rgba(59,130,246,0.4)', icon: '📋' },
  { key: 'TARGETED',       label: 'Targeted',        color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)', icon: '🎯' },
  { key: 'PREPARING',      label: 'Preparing',       color: '#f59e0b', glow: 'rgba(245,158,11,0.4)', icon: '📚' },
  { key: 'ASSESSED',       label: 'Assessed',        color: '#f97316', glow: 'rgba(249,115,22,0.4)', icon: '✏️' },
  { key: 'INTERVIEW_READY',label: 'Interview Ready', color: '#10b981', glow: 'rgba(16,185,129,0.4)', icon: '⭐' },
  { key: 'POST_INTERVIEW', label: 'Post-Interview',  color: '#6366f1', glow: 'rgba(99,102,241,0.4)', icon: '🎓' },
];

type Student = {
  id: string;
  name: string;
  current_state: string;
  confidence_score: number;
  branch: string;
};

type FunnelProps = {
  collegeId?: string;
  refreshTrigger?: number;
};

export default function PlacementFunnel({ collegeId = 'college-lpu-001', refreshTrigger = 0 }: FunnelProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [prevCounts, setPrevCounts] = useState<Record<string, number>>({});
  const [changedState, setChangedState] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents(collegeId);
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      // Backend might be down — use demo data
      setStudents(DEMO_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [refreshTrigger]);

  // Auto-refresh every 5s during active demo
  useEffect(() => {
    const interval = setInterval(fetchStudents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Detect state changes for highlight animation
  useEffect(() => {
    if (students.length === 0) return;
    const newCounts: Record<string, number> = {};
    PIPELINE_STATES.forEach(s => {
      newCounts[s.key] = students.filter(st => st.current_state === s.key).length;
    });

    const changed = Object.keys(newCounts).find(k => newCounts[k] !== (prevCounts[k] ?? newCounts[k]));
    if (changed) {
      setChangedState(changed);
      setTimeout(() => setChangedState(null), 2000);
    }
    setPrevCounts(newCounts);
  }, [students]);

  const stateCounts: Record<string, Student[]> = {};
  PIPELINE_STATES.forEach(s => {
    stateCounts[s.key] = students.filter(st => st.current_state === s.key);
  });

  const total = students.length || 1;
  const selectedStudents = selectedState ? stateCounts[selectedState] ?? [] : [];

  return (
    <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Live Placement Pipeline</div>
          <h3 className="text-lg font-bold text-white">{students.length} Students Tracked</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block" />
          Auto-refreshing · {collegeId.split('-').pop()?.toUpperCase()}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-[#4b4b6b] text-sm">Loading pipeline data...</div>
      ) : (
        <>
          {/* Funnel Bars */}
          <div className="space-y-3">
            {PIPELINE_STATES.map((stage, idx) => {
              const count = stateCounts[stage.key]?.length ?? 0;
              const pct = (count / total) * 100;
              const isSelected = selectedState === stage.key;
              const isChanged = changedState === stage.key;

              // Funnel effect: max width decreases per stage
              const maxWidth = Math.max(40, 100 - idx * 7);

              return (
                <button
                  key={stage.key}
                  onClick={() => setSelectedState(isSelected ? null : stage.key)}
                  style={{ maxWidth: `${maxWidth}%` }}
                  className={`w-full text-left transition-all duration-500 ${isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                >
                  <div className={`relative flex items-center gap-3 rounded-xl px-4 py-3 border transition-all duration-300 ${
                    isChanged
                      ? 'border-white/30 scale-[1.02]'
                      : isSelected
                        ? 'border-white/20 bg-white/5'
                        : 'border-[#1e1e30] hover:border-[#2a2a3d]'
                  }`}
                    style={isChanged ? { boxShadow: `0 0 20px ${stage.glow}` } : undefined}
                  >
                    {/* Colored bar fill */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-10 transition-all duration-700"
                      style={{ background: stage.color, width: `${Math.max(pct, 4)}%` }}
                    />
                    <span className="relative text-base z-10 w-5">{stage.icon}</span>
                    <div className="relative flex-1 flex items-center justify-between z-10">
                      <span className="text-sm font-medium text-[#c4c4d8]">{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-[#1e1e30] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(pct, 2)}%`, background: stage.color, boxShadow: `0 0 8px ${stage.glow}` }}
                          />
                        </div>
                        <span className="text-sm font-bold min-w-[28px] text-right" style={{ color: stage.color }}>
                          {count}
                        </span>
                      </div>
                    </div>
                    {isChanged && (
                      <span className="relative z-10 text-xs px-2 py-0.5 rounded-full bg-white/10 text-white animate-pulse">
                        updated
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected state drill-down */}
          {selectedState && (
            <div className="mt-5 border-t border-[#1e1e30] pt-4 animate-fade-in-up">
              <div className="text-xs text-[#6b7280] font-mono uppercase mb-3">
                {selectedState} — {selectedStudents.length} student(s)
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {selectedStudents.length === 0 ? (
                  <div className="text-xs text-[#4b4b6b]">No students in this state.</div>
                ) : selectedStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-xs bg-[#0a0a14] border border-[#1e1e30] rounded-lg px-3 py-2">
                    <span className="text-[#c4c4d8] font-medium">{s.name}</span>
                    <div className="flex items-center gap-3 text-[#6b7280]">
                      <span>{s.branch}</span>
                      <span className="text-indigo-400 font-mono">
                        {((s.confidence_score ?? 0) * 100).toFixed(0)}% ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Demo fallback data when backend is down
const DEMO_STUDENTS: Student[] = [
  { id: 's1', name: 'Rahul Sharma', current_state: 'PREPARING', confidence_score: 0.48, branch: 'CSE' },
  { id: 's2', name: 'Priya Mehta', current_state: 'INTERVIEW_READY', confidence_score: 0.82, branch: 'ECE' },
  { id: 's3', name: 'Arjun Singh', current_state: 'TARGETED', confidence_score: 0.0, branch: 'CSE' },
  { id: 's4', name: 'Sneha Patel', current_state: 'ASSESSED', confidence_score: 0.55, branch: 'IT' },
  { id: 's5', name: 'Karan Verma', current_state: 'UNAWARE', confidence_score: 0.0, branch: 'CSE' },
  { id: 's6', name: 'Deepa Nair', current_state: 'PROFILED', confidence_score: 0.2, branch: 'CSE' },
  { id: 's7', name: 'Rohan Gupta', current_state: 'PREPARING', confidence_score: 0.41, branch: 'MCA' },
  { id: 's8', name: 'Anjali Kumar', current_state: 'POST_INTERVIEW', confidence_score: 0.73, branch: 'CSE' },
];
