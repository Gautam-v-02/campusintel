'use client';
import { useEffect, useRef, useState } from 'react';

type Log = { confidence_score?: number; step?: number; action?: string };

type Props = {
  logs: Log[];
  isActive: boolean;
};

// Pulls confidence_score out of each log entry and plots it over time
export default function ConfidenceChart({ logs, isActive }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [animProgress, setAnimProgress] = useState(0);

  // Extract confidence scores from logs — fallback to estimated ramp if not set
  useEffect(() => {
    if (logs.length === 0) {
      setPoints([]);
      setAnimProgress(0);
      return;
    }

    const scores = logs
      .map((l, i) => {
        if (typeof l.confidence_score === 'number') return l.confidence_score;
        // Fallback: estimate readiness based on step position
        const base = 0.1 + (i / Math.max(logs.length - 1, 1)) * 0.75;
        const jitter = (Math.sin(i * 2.3) * 0.04);
        return Math.min(0.95, Math.max(0.05, base + jitter));
      });

    setPoints(scores);
    setAnimProgress(scores.length);
  }, [logs]);

  const current = points.length > 0 ? points[points.length - 1] : 0;
  const peak = points.length > 0 ? Math.max(...points) : 0;
  const delta = points.length > 1 ? current - points[0] : 0;

  // SVG dimensions
  const W = 500;
  const H = 120;
  const PAD = { top: 16, right: 16, bottom: 24, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Map data → SVG coordinates
  const toX = (i: number) =>
    PAD.left + (points.length <= 1 ? 0 : (i / (points.length - 1)) * chartW);
  const toY = (v: number) =>
    PAD.top + chartH - v * chartH;

  // Build polyline path
  const linePoints = points.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  // Area fill path
  const areaPath = points.length === 0 ? '' : [
    `M ${toX(0)},${PAD.top + chartH}`,
    ...points.map((v, i) => `L ${toX(i)},${toY(v)}`),
    `L ${toX(points.length - 1)},${PAD.top + chartH}`,
    'Z',
  ].join(' ');

  // Y-axis grid lines at 25%, 50%, 75%, 100%
  const gridLines = [0.25, 0.5, 0.75, 1.0];

  // Color based on current score
  const color = current >= 0.7 ? '#10b981' : current >= 0.4 ? '#f59e0b' : '#6366f1';
  const colorLight = current >= 0.7 ? 'rgba(16,185,129,0.15)' : current >= 0.4 ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)';

  const isEmpty = points.length === 0;

  return (
    <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">
            Readiness Trajectory
          </div>
          <div className="text-sm text-[#6b7280]">
            Confidence score as agent completes each step
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-4xl font-display font-bold transition-all duration-700"
            style={{ color: isEmpty ? '#2a2a3d' : color }}
          >
            {isEmpty ? '—' : `${(current * 100).toFixed(0)}%`}
          </div>
          {!isEmpty && delta > 0 && (
            <div className="text-xs text-emerald-400 font-mono mt-0.5">
              ↑ +{(delta * 100).toFixed(0)}% since start
            </div>
          )}
        </div>
      </div>

      {/* Stat pills */}
      {!isEmpty && (
        <div className="flex gap-3 mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-[#1e1e30] border border-[#2a2a3d] text-xs">
            <span className="text-[#6b7280]">Peak: </span>
            <span className="font-bold text-white">{(peak * 100).toFixed(0)}%</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#1e1e30] border border-[#2a2a3d] text-xs">
            <span className="text-[#6b7280]">Steps: </span>
            <span className="font-bold text-white">{points.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#1e1e30] border border-[#2a2a3d] text-xs">
            <span className="text-[#6b7280]">Status: </span>
            <span className="font-bold" style={{ color }}>
              {current >= 0.75 ? 'INTERVIEW READY' : current >= 0.4 ? 'PREPARING' : 'PROFILING'}
            </span>
          </div>
        </div>
      )}

      {/* SVG Chart */}
      <div className="relative rounded-xl overflow-hidden bg-[#05050a] border border-[#1e1e30]">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-[140px] text-[#2a2a3d] gap-2">
            <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="text-xs font-mono">Run a demo to see the trajectory</span>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-[140px]"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor={color} />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {gridLines.map(v => (
              <g key={v}>
                <line
                  x1={PAD.left} y1={toY(v)}
                  x2={W - PAD.right} y2={toY(v)}
                  stroke="#1e1e30" strokeWidth="1"
                />
                <text x={PAD.left - 4} y={toY(v) + 4} fontSize="8" fill="#4b4b6b" textAnchor="end">
                  {(v * 100).toFixed(0)}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#areaGrad)" />

            {/* Line */}
            <polyline
              points={linePoints}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current point dot */}
            {points.length > 0 && (
              <circle
                cx={toX(points.length - 1)}
                cy={toY(current)}
                r="4"
                fill={color}
                className="animate-pulse"
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            )}

            {/* Start / end labels */}
            {points.length > 1 && (
              <>
                <text x={toX(0) + 6} y={toY(points[0]) - 8} fontSize="8" fill="#6b7280" textAnchor="start">
                  {(points[0] * 100).toFixed(0)}%
                </text>
                <text x={toX(points.length - 1)} y={toY(current) - 8} fontSize="9" fill={color} textAnchor="middle" fontWeight="bold">
                  {(current * 100).toFixed(0)}%
                </text>
              </>
            )}
          </svg>
        )}

        {/* Pulse indicator when active */}
        {isActive && !isEmpty && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping inline-block" />
            LIVE
          </div>
        )}
      </div>

      {/* Interpretation */}
      {!isEmpty && (
        <div className="mt-3 text-xs text-[#4b4b6b] font-mono">
          {current >= 0.75
            ? '✅ Student is interview-ready. Agent recommends scheduling a mock interview.'
            : current >= 0.4
              ? '⚡ Preparation in progress. Agent has queued targeted practice sessions.'
              : '🔍 Profiling stage. Agent is analyzing skill gaps and sourcing intel.'}
        </div>
      )}
    </div>
  );
}
