'use client';
import { AgentLog } from '@/hooks/useAgentLogs';

interface Props {
  logs: AgentLog[];
}

export default function PrepBrief({ logs }: Props) {
  const briefLog = logs.find(l => l.step_name === 'GENERATE_BRIEF');
  
  if (!briefLog) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-gray-900/50 rounded-xl border border-gray-800">
        Brief will appear here after agent completes generation.
      </div>
    );
  }

  const brief = briefLog.output as any;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-[500px] overflow-y-auto custom-scrollbar">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Interview Prep Brief</h2>
        <p className="text-emerald-400 font-medium">{brief.headline}</p>
        <div className="mt-2 text-xs flex gap-3 text-gray-400">
          <span className="px-2 py-1 bg-gray-800 rounded">Data: {brief.confidence_in_data} Confidence</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            📊 Top Frequency Topics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brief.topics?.map((topic: any, i: number) => (
              <div key={i} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-blue-400">{topic.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${topic.gap_severity === 'CRITICAL' ? 'bg-red-900/40 text-red-400' : 'bg-amber-900/40 text-amber-400'}`}>
                    {topic.gap_severity} GAP
                  </span>
                </div>
                <div className="text-gray-300 text-sm mb-2">{topic.specific_subtopics?.join(', ')}</div>
                <div className="text-gray-500 text-xs">Requires ~{topic.time_to_allocate_hours}h prep</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">⏱️ Generated Prep Plan</h3>
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
            {brief.prep_plan?.schedule?.map((day: any, i: number) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-600 bg-gray-800 text-gray-300 text-xs font-semibold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {day.day}
                </div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-gray-800/80 p-3 rounded border border-gray-700 shadow">
                  <div className="font-semibold text-white text-sm mb-1">{day.focus}</div>
                  <ul className="list-disc list-inside text-gray-400 text-xs">
                    {day.tasks?.map((t: string, j: number) => <li key={j}>{t}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
