'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ResumeUploader from '@/components/student/ResumeUploader';

export default function OnboardingPage() {
  const router = useRouter();
  const [complete, setComplete] = useState(false);

  const handleExtracted = (skills: Record<string, number>) => {
    setComplete(true);
    // Give them a moment to see the cool extraction UI, then route them in
    setTimeout(() => {
      router.push('/dashboard');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#070711] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 60%)' }} />

      <div className="relative z-10 w-full max-w-[600px] mt-10 mb-20 text-center">
        {/* Progress header */}
        <div className="flex items-center justify-center gap-4 mb-10 text-xs font-mono uppercase tracking-widest text-[#6b7280]">
           <span className={`${complete ? 'text-[#c4c4d8]' : 'text-indigo-400 font-bold'}`}>Step 1: Parse</span>
           <span className="w-8 h-px bg-[#2a2a3d]" />
           <span className={`${complete ? 'text-indigo-400 font-bold' : ''}`}>Step 2: Initialize Agent</span>
        </div>

        <h1 className="font-display text-4xl text-[#e8e6f8] tracking-tight mb-4">
          No forms. No data entry.
        </h1>
        <p className="text-[#8b8b9f] text-lg max-w-md mx-auto mb-10">
          Upload your latest resume. Our agent will extract your active tech stack, infer your baseline proficiency, and build your initial prep profile instantly.
        </p>

        <div className="text-left">
          <ResumeUploader studentId="demo-student-new" onSkillsExtracted={handleExtracted} />
        </div>

        {complete && (
           <div className="mt-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                 <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                 </svg>
                 Initializing Autonomous Agent... redirecting to Dashboard
              </div>
           </div>
        )}
      </div>

      {/* TPC Admin override */}
      <div className="absolute bottom-6 w-full text-center">
        <a href="/login" className="text-xs text-[#4b4b6b] hover:text-[#c4c4d8] transition">
          Already have an account? Sign in.
        </a>
      </div>
    </div>
  );
}
