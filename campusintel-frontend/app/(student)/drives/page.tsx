'use client';

const DRIVES = [
  { id: 'g1', co: 'Google', logo: 'google.com', date: 'Apr 11', days: 2, pkg: '30–40 LPA', branches: ['CSE', 'IT', 'ECE'], rounds: 4, status: 'Registered' },
  { id: 'i1', co: 'Infosys', logo: 'infosys.com', date: 'Apr 15', days: 6, pkg: '6.5 LPA', branches: ['All'], rounds: 3, status: 'Registered' },
  { id: 'w1', co: 'Wipro', logo: 'wipro.com', date: 'Apr 18', days: 9, pkg: '6.5 LPA', branches: ['CSE', 'IT'], rounds: 2, status: 'Not Registered' },
  { id: 'a1', co: 'Amazon', logo: 'amazon.com', date: 'Apr 22', days: 13, pkg: '20–28 LPA', branches: ['CSE', 'ECE'], rounds: 5, status: 'Not Registered' },
  { id: 'm1', co: 'Microsoft', logo: 'microsoft.com', date: 'Apr 25', days: 16, pkg: '25–35 LPA', branches: ['CSE'], rounds: 4, status: 'Not Registered' },
  { id: 'f1', co: 'Flipkart', logo: 'flipkart.com', date: 'Apr 28', days: 19, pkg: '18–22 LPA', branches: ['CSE', 'IT'], rounds: 4, status: 'Registered' },
];

const STATUS_STYLE: Record<string, string> = {
  'Registered': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  'Not Registered': 'bg-transparent border-[#3a3a4d] text-[#6b7280]',
  'Selected': 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  'Rejected': 'bg-red-500/10 border-red-500/30 text-red-400',
};

export default function DrivesPage() {
  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <h1 className="font-display text-3xl text-[#e8e6f8] mb-2">Campus Drives</h1>
      <p className="text-[#6b7280] text-sm mb-8">All upcoming placement drives registered at LPU</p>

      {/* Filter bar */}
      <div className="flex gap-3 mb-8">
        <input placeholder="Search company..."
          className="flex-1 max-w-xs h-10 rounded-lg bg-[#0f0f1a] border border-[#2a2a3d] px-3 text-sm text-[#e8e6f8] placeholder:text-[#4b4b6b] outline-none focus:border-indigo-500/60 transition" />
        {['All Status', 'Registered', 'Not Registered'].map(f => (
          <button key={f}
            className="px-4 h-10 rounded-lg border border-[#2a2a3d] text-sm text-[#6b7280] hover:text-[#c4c4d8] hover:border-indigo-500/40 transition bg-[#0f0f1a]">
            {f}
          </button>
        ))}
      </div>

      {/* Drive grid */}
      <div className="grid grid-cols-3 gap-4">
        {DRIVES.map(d => (
          <div key={d.id} className="card-dark rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all group">
            <div className="flex items-start gap-3 mb-4">
              <img src={`https://logo.clearbit.com/${d.logo}`} alt={d.co}
                className="w-10 h-10 rounded-xl bg-[#2a2a3d]"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display='none'; }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#e8e6f8]">{d.co}</div>
                <div className="text-[11px] text-[#6b7280]">{d.date} · {d.days} days away</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280]">Package</span>
                <span className="text-indigo-300 font-semibold">{d.pkg}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6b7280]">Rounds</span>
                <span className="text-[#c4c4d8]">{d.rounds} rounds</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {d.branches.map(b => (
                <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a2e] border border-[#2a2a3d] text-[#9b9bbb]">{b}</span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[d.status]}`}>
                {d.status}
              </span>
              {d.status === 'Registered' ? (
                <a href={`/briefs/${d.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition">View Brief →</a>
              ) : (
                <button className="text-xs text-[#6b7280] hover:text-[#c4c4d8] border border-[#2a2a3d] hover:border-indigo-500/40 px-3 py-1 rounded-lg transition">
                  Register →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
