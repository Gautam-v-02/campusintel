'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getStudent } from '@/lib/auth';

export default function BriefsIndex() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const student = getStudent();
      if (!student?.id) {
        router.replace('/login');
        return;
      }
      try {
        const regs = await api.getStudentRegistrations(student.id);
        if (Array.isArray(regs) && regs.length > 0) {
          router.replace(`/briefs/${regs[0].drive_id}`);
          return;
        }
      } catch {}
      // Fallback: go to drives page to register first
      router.replace('/drives');
    };
    redirect();
  }, [router]);

  return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="flex items-center gap-3 text-[#6b7280] text-sm">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading your briefs...
      </div>
    </div>
  );
}
