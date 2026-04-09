'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import PlacementFunnel from './PlacementFunnel';

export default function TpcDashboard({ isDemoActive, contextName = 'Rahul' }: { isDemoActive: boolean, contextName?: string }) {
  const [weights, setWeights] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recording, setRecording] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'FUNNEL' | 'WEIGHTS' | 'ALERTS'>('FUNNEL');

  useEffect(() => {
    loadData();
  }, [isDemoActive]);

  const loadData = async () => {
    try {
      const [w, a] = await Promise.all([
        api.getStrategyWeights(),
        api.getAlerts('college-lpu-001'),
      ]);
      setWeights(Array.isArray(w) ? w : []);
      setAlerts(Array.isArray(a) ? a : []);
    } catch { /* ignore */ }
  };

  const handleOutcome = async (outcome: string) => {
    setRecording(true);
    try {
      await api.recordOutcome('demo-student-rahul', 'demo-drive-google', outcome);
      await loadData();
      setRefreshCount(c => c + 1); // trigger funnel refresh
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 min-h-[500px]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-white">🏫 TPC Admin Dashboard</h2>
        <span className="text-xs text-gray-500 font-mono">LPU · Live</span>
      </div>

      {/* Outcome recording */}
      <div className="mb-5">
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Record Outcome ({contextName})</div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOutcome('selected')}
            disabled={recording}
            className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/50 py-2.5 rounded-lg font-semibold transition disabled:opacity-50 text-sm"
          >
            ✅ Mark Selected
          </button>
          <button
            onClick={() => handleOutcome('rejected')}
            disabled={recording}
            className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 py-2.5 rounded-lg font-semibold transition disabled:opacity-50 text-sm"
          >
            ❌ Mark Rejected
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1.5">Recording an outcome triggers the learning loop → strategy weights update instantly.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {(['FUNNEL', 'WEIGHTS', 'ALERTS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition ${
              activeTab === tab
                ? 'text-emerald-400 bg-gray-800 border border-b-0 border-gray-700'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'FUNNEL' ? '📊 Pipeline Funnel' : tab === 'WEIGHTS' ? '🧠 Strategy Weights' : `🚨 Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}`}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto max-h-[380px] custom-scrollbar">
        {activeTab === 'FUNNEL' && (
          <PlacementFunnel collegeId="college-lpu-001" refreshTrigger={refreshCount} />
        )}

        {activeTab === 'WEIGHTS' && (
          <div className="space-y-2">
            {weights?.map((w, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div>
                  <div className="text-sm font-medium text-white">{w.strategy}</div>
                  <div className="text-xs text-gray-400">{w.student_profile_type}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">{w.weight?.toFixed(2)}w</div>
                  <div className="text-xs text-gray-500">{(w.win_rate * 100).toFixed(0)}% win rate ({w.times_successful}/{w.times_used})</div>
                </div>
              </div>
            ))}
            {weights.length === 0 && <div className="text-sm text-gray-500">No strategy weights found. Run a demo first.</div>}
          </div>
        )}

        {activeTab === 'ALERTS' && (
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">No TPC alerts. System is healthy.</div>
            ) : alerts.map((a, i) => (
              <div key={i} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <div className="text-sm font-medium text-red-300">{a.content}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(a.sent_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

