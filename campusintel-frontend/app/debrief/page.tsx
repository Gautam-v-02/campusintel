'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const ROUND_TYPES = [
  { value: 'online_test', label: '💻 Online Test / OA' },
  { value: 'technical_1', label: '🔧 Technical Round 1' },
  { value: 'technical_2', label: '🔧 Technical Round 2' },
  { value: 'system_design', label: '🏗️ System Design' },
  { value: 'hr', label: '🤝 HR Round' },
  { value: 'managerial', label: '📊 Managerial Round' },
  { value: 'group_discussion', label: '🗣️ Group Discussion' },
];

const TOPIC_OPTIONS = [
  'arrays', 'linked_lists', 'trees', 'graphs', 'dp', 'system_design',
  'dbms', 'os', 'networking', 'oops', 'sql', 'behavioral',
  'aptitude', 'verbal', 'python', 'java', 'javascript', 'cpp',
];

// Demo data — mimics an LPU student submitting after a real Google interview
const DEMO_FILL = {
  roundType: 'technical_1',
  questionsAsked: 'Design a URL shortening service (like bit.ly). Also asked about LRU cache implementation and time complexity of my solutions.',
  topicsCovered: ['system_design', 'arrays', 'graphs'],
  outcome: 'selected' as const,
  difficultyRating: 4,
};

export default function DebriefPage() {
  const [form, setForm] = useState({
    roundType: 'technical_1',
    questionsAsked: '',
    topicsCovered: [] as string[],
    outcome: 'selected',
    difficultyRating: 3,
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleTopic = (topic: string) => {
    setForm(f => ({
      ...f,
      topicsCovered: f.topicsCovered.includes(topic)
        ? f.topicsCovered.filter(t => t !== topic)
        : [...f.topicsCovered, topic],
    }));
  };

  const autofillDemo = () => {
    setForm(f => ({ ...f, ...DEMO_FILL }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.questionsAsked.trim()) {
      setErrorMsg('Please describe at least one question asked.');
      return;
    }
    if (form.topicsCovered.length === 0) {
      setErrorMsg('Please select at least one topic covered.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await api.submitDebrief({
        driveId: 'demo-drive-google',
        collegeId: 'college-lpu-001',
        companyId: 'company-google-001',
        ...form,
      });

      if (res.success) {
        setResult(res);
        setStatus('success');
      } else {
        setErrorMsg(res.error || 'Submission failed.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg('Could not reach the server. Check that the backend is running.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-[#e8e6f8] font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#1e1e30] bg-[#05050a]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#9b9bbb] hover:text-white transition">
            ← CampusIntel
          </Link>
          <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">Submit Debrief</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-mono tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            Feed the Network
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-3">
            Share Your Interview Experience
          </h1>
          <p className="text-[#8b8b9f] text-lg leading-relaxed">
            One debrief from you immediately improves prep briefs for <strong className="text-white">every future candidate</strong> at your college.
            The agent re-synthesizes intelligence the moment you hit submit.
          </p>
        </div>

        {status === 'success' && result ? (
          <SuccessScreen result={result} onReset={() => { setStatus('idle'); setResult(null); setForm({ roundType: 'technical_1', questionsAsked: '', topicsCovered: [], outcome: 'selected', difficultyRating: 3 }); }} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Demo autofill banner */}
            <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-5 py-3">
              <div>
                <div className="text-sm font-semibold text-indigo-300">🎬 Hackathon Demo Mode</div>
                <div className="text-xs text-indigo-400/70 mt-0.5">Click to autofill with a real Google interview debrief for a live demo.</div>
              </div>
              <button type="button" onClick={autofillDemo} className="text-xs px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition">
                Autofill Demo
              </button>
            </div>

            {/* Round Type */}
            <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
              <label className="block text-sm font-semibold text-[#9b9bbb] mb-3 uppercase tracking-wider">Round Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ROUND_TYPES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, roundType: r.value }))}
                    className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition border ${
                      form.roundType === r.value
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-indigo-300'
                        : 'border-[#2a2a3d] text-[#8b8b9f] hover:border-[#3a3a4d] hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Asked */}
            <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
              <label className="block text-sm font-semibold text-[#9b9bbb] mb-3 uppercase tracking-wider">
                What Questions Were Asked?
              </label>
              <textarea
                value={form.questionsAsked}
                onChange={e => setForm(f => ({ ...f, questionsAsked: e.target.value }))}
                placeholder="e.g., Design a URL shortening service. Also asked about LRU cache and time complexity..."
                rows={4}
                className="w-full bg-[#05050a] border border-[#2a2a3d] rounded-xl px-4 py-3 text-sm text-[#e8e6f8] placeholder-[#4b4b6b] focus:outline-none focus:border-indigo-500/60 resize-none"
              />
            </div>

            {/* Topics Covered */}
            <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
              <label className="block text-sm font-semibold text-[#9b9bbb] mb-3 uppercase tracking-wider">
                Topics Covered <span className="text-[#4b4b6b] normal-case font-normal">(Select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTopic(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition border ${
                      form.topicsCovered.includes(t)
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'border-[#2a2a3d] text-[#6b7280] hover:border-[#3a3a4d] hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Outcome + Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
                <label className="block text-sm font-semibold text-[#9b9bbb] mb-3 uppercase tracking-wider">Outcome</label>
                <div className="space-y-2">
                  {[
                    { value: 'selected', label: '✅ Selected', color: 'emerald' },
                    { value: 'rejected', label: '❌ Rejected', color: 'red' },
                    { value: 'waiting', label: '⏳ Waiting', color: 'amber' },
                    { value: 'withdrew', label: '🚪 Withdrew', color: 'gray' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, outcome: opt.value }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${
                        form.outcome === opt.value
                          ? `bg-${opt.color}-500/10 border-${opt.color}-500/40 text-${opt.color}-300`
                          : 'border-[#2a2a3d] text-[#8b8b9f] hover:border-[#3a3a4d]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
                <label className="block text-sm font-semibold text-[#9b9bbb] mb-3 uppercase tracking-wider">
                  Difficulty Rating
                </label>
                <div className="flex flex-col gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, difficultyRating: n }))}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition border ${
                        form.difficultyRating === n
                          ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
                          : 'border-[#2a2a3d] text-[#6b7280] hover:border-[#3a3a4d]'
                      }`}
                    >
                      <span className="font-bold w-3">{n}</span>
                      <span>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
                      <span className="text-xs opacity-60">
                        {n === 1 ? 'Very Easy' : n === 2 ? 'Easy' : n === 3 ? 'Medium' : n === 4 ? 'Hard' : 'Very Hard'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-4 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.2)]"
            >
              {status === 'submitting' ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Re-synthesizing Intel...
                </>
              ) : (
                <>⚡ Submit & Update Intel</>
              )}
            </button>
            <p className="text-center text-xs text-[#4b4b6b]">
              Your debrief is anonymous to other students. It immediately updates the company intelligence used in all future agent runs.
            </p>
          </form>
        )}
      </main>
    </div>
  );
}

// Success screen with intel diff
function SuccessScreen({ result, onReset }: { result: any; onReset: () => void }) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">⚡</div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Intel Updated!</h2>
        <p className="text-emerald-400 text-sm">{result.message}</p>
      </div>

      <div className="bg-[#0a0a14] border border-[#1e1e30] rounded-2xl p-6">
        <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-4">
          🧠 Re-synthesized Intelligence — {result.total_debriefs} Total Debriefs
        </div>
        <div className="space-y-2">
          {result.synthesized_topics?.map((t: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#6b7280] w-4">{i + 1}</span>
              <div className="flex-1 bg-[#1e1e30] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${(t.frequency * 100).toFixed(0)}%` }}
                />
              </div>
              <span className="text-sm font-mono text-[#c4c4d8] w-32">{t.topic}</span>
              <span className="text-sm font-bold text-indigo-400">{(t.frequency * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/demo"
          className="flex-1 py-3 rounded-xl font-semibold text-center bg-indigo-600 hover:bg-indigo-700 text-white transition"
        >
          🧠 Run Agent with Updated Intel →
        </Link>
        <button
          onClick={onReset}
          className="px-6 py-3 rounded-xl font-semibold border border-[#2a2a3d] text-[#9b9bbb] hover:bg-white/5 transition"
        >
          Submit Another
        </button>
      </div>
    </div>
  );
}
