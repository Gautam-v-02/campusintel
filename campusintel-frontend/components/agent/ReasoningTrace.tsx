'use client';
import { useEffect, useRef } from 'react';
import { AgentLog } from '@/hooks/useAgentLogs';

interface Props {
  logs: AgentLog[];
  isActive: boolean;
}

const STEP_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  OBSERVE_PROFILE: { icon: '👁️', label: 'Observing Profile', color: 'text-blue-400' },
  COLD_START_DETECTED: { icon: '❄️', label: 'Cold Start Check', color: 'text-purple-400' },
  QUERY_LOCAL_DB: { icon: '🗄️', label: 'Querying Local DB', color: 'text-yellow-400' },
  QUERY_GLOBAL_DB: { icon: '🌍', label: 'Querying Global DB', color: 'text-orange-400' },
  SCRAPE_COMPANY_INTEL: { icon: '🕷️', label: 'Scraping Intel', color: 'text-red-400' },
  ASSESS_READINESS: { icon: '📊', label: 'Assessing Readiness', color: 'text-indigo-400' },
  SELECT_STRATEGY: { icon: '🧠', label: 'Selecting Strategy', color: 'text-emerald-400' },
  GENERATE_BRIEF: { icon: '📝', label: 'Generating Brief', color: 'text-cyan-400' },
  GENERATE_ASSESSMENT: { icon: '✍️', label: 'Generating Assessment', color: 'text-violet-400' },
  SCHEDULE_SESSION: { icon: '📅', label: 'Scheduling Session', color: 'text-pink-400' },
  ALERT_TPC: { icon: '⚠️', label: 'Checking TPC Alert', color: 'text-amber-400' },
  UPDATE_STUDENT_STATE: { icon: '🔄', label: 'Updating State', color: 'text-teal-400' },
  ERROR: { icon: '❌', label: 'Agent Error', color: 'text-red-500' },
};

const STATUS_ICONS = {
  success: '✓',
  failed: '✗',
  skipped: '⏭',
  fallback_triggered: '↩',
};

export default function ReasoningTrace({ logs, isActive }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col h-[500px] font-mono text-sm shadow-2xl overflow-hidden relative">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs">🧠 Agent Reasoning Trace</h3>
        {isActive && (
          <span className="flex items-center gap-2 text-emerald-400 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AGENT ACTIVE
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {logs.length === 0 && !isActive && (
          <div className="h-full flex items-center justify-center text-gray-500">
            Awaiting trigger...
          </div>
        )}

        {logs.map((log) => {
          const config = STEP_CONFIG[log.step_name] || { icon: '⚙️', label: log.step_name, color: 'text-gray-400' };
          
          return (
            <div key={log.id} className="animate-fade-in-up border-l-2 border-gray-700 pl-4 py-1 relative">
              <div className={`absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-gray-900 border-2 ${
                log.status === 'success' ? 'border-emerald-500' :
                log.status === 'fallback_triggered' ? 'border-amber-500' :
                log.status === 'skipped' ? 'border-gray-600' : 'border-red-500'
              }`}></div>
              
              <div className="flex justify-between items-start">
                <span className={`font-semibold ${config.color} flex items-center gap-2`}>
                  {config.icon} {config.label}
                </span>
                <div className="flex items-center gap-3">
                  {log.duration_ms !== null && (
                    <span className="text-gray-500 text-xs">{log.duration_ms}ms</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    log.status === 'success' ? 'bg-emerald-900/30 text-emerald-400' :
                    log.status === 'fallback_triggered' ? 'bg-amber-900/30 text-amber-400' :
                    log.status === 'skipped' ? 'text-gray-500' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {STATUS_ICONS[log.status]} {log.decision_made || log.status}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-gray-300 text-xs leading-relaxed opacity-90 break-words">
                {log.decision_basis}
              </div>
              
              {log.status === 'fallback_triggered' && (
                <div className="mt-2 text-amber-400/80 text-xs italic bg-amber-900/10 p-2 rounded">
                  ⚠️ Fallback path activated.
                </div>
              )}
            </div>
          );
        })}
        
        {isActive && (
          <div className="border-l-2 border-emerald-500/50 pl-4 py-2 mt-4">
            <span className="text-emerald-400 flex items-center gap-2">
              <span className="animate-pulse">Thinking...</span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
