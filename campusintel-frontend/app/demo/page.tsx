'use client';
import { useState } from 'react';
import ReasoningTrace from '@/components/agent/ReasoningTrace';
import PrepBrief from '@/components/student/PrepBrief';
import TpcDashboard from '@/components/tpc/TpcDashboard';
import { useAgentLogs } from '@/hooks/useAgentLogs';
import { api } from '@/lib/api';

export default function DemoScreen() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'TRACE' | 'BRIEF' | 'TPC'>('TRACE');
  const [scenario, setScenario] = useState<'STANDARD' | 'LOW_DATA' | 'HIGH_CONF'>('STANDARD');
  
  const { logs, wsConnected } = useAgentLogs(sessionId);

  const handleTrigger = async (type: 'STANDARD' | 'LOW_DATA' | 'HIGH_CONF') => {
    setIsRunning(true);
    setScenario(type);
    setActiveTab('TRACE');
    try {
      let res;
      if (type === 'STANDARD') res = await api.triggerDemo();
      else if (type === 'LOW_DATA') res = await api.triggerLowData();
      else res = await api.triggerHighConfidence();
      
      if (res.sessionId) setSessionId(res.sessionId);
      // for mock/stub responses
      if (res.status?.includes('triggered') && !res.sessionId) {
        // Find latest session from status if not returned directly
        setTimeout(async () => {
          const st = await api.getAgentStatus(); // Make sure this uses the api utility
          if (st.recent_steps?.[0]?.session_id) setSessionId(st.recent_steps[0].session_id);
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header containing the scenario triggers */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">CampusIntel</h1>
            <p className="text-gray-400 mt-1">Autonomous Placement Intelligence Engine</p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={`flex items-center gap-1 ${wsConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                {wsConnected ? 'Live Connection Active' : 'Polling Fallback Active'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => handleTrigger('STANDARD')}
              disabled={isRunning}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/20"
            >
              ▶ Standard Demo (Rahul)
            </button>
            <button 
              onClick={() => handleTrigger('LOW_DATA')}
              disabled={isRunning}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition disabled:opacity-50 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/20"
            >
              ⚡ Scrape Fallback
            </button>
            <button 
              onClick={() => handleTrigger('HIGH_CONF')}
              disabled={isRunning}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition disabled:opacity-50 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
            >
              ⭐ High Confidence (Priya)
            </button>
          </div>
        </header>

        {/* Info Context Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center text-xl">🎓</div>
            <div>
              <div className="text-sm text-gray-500 font-semibold mb-0.5">CURRENT CONTEXT</div>
              <div className="font-medium text-gray-200">
                {scenario === 'HIGH_CONF' ? 'Priya Mehta (High Confidence)' : 'Rahul Sharma (Low Confidence)'}
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex items-center gap-4">
            <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center text-xl">🏢</div>
            <div>
              <div className="text-sm text-gray-500 font-semibold mb-0.5">DETECTED EVENT</div>
              <div className="font-medium text-gray-200">Google Campus Drive in 68 hours</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-800 pb-px">
          {['TRACE', 'BRIEF', 'TPC'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-gray-900 text-emerald-400 border border-b-0 border-gray-800 relative after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-px after:bg-gray-900' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'TRACE' ? '🧠 Live Reasoning Trace' : tab === 'BRIEF' ? '📋 Generated Brief' : '🏫 TPC Dashboard'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-6">
          {activeTab === 'TRACE' && <ReasoningTrace logs={logs} isActive={isRunning} />}
          {activeTab === 'BRIEF' && <PrepBrief logs={logs} />}
          {activeTab === 'TPC' && <TpcDashboard isDemoActive={!!sessionId} />}
        </div>
        
      </div>
    </div>
  );
}
