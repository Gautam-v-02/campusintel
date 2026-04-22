// src/agent/learner.js — Epsilon-Greedy RL Weight Updater
import supabase from '../lib/supabase.js';

/**
 * Called when a student outcome is recorded.
 * Updates strategy weights via incremental win-rate calculation.
 */
export async function updateStrategyWeights({ studentId, driveId, outcome }) {
  // 1. Find what strategy was used for this student
  const { data: logs } = await supabase
    .from('agent_logs')
    .select('decision_made, input')
    .eq('student_id', studentId)
    .eq('drive_id', driveId)
    .eq('step_name', 'SELECT_STRATEGY')
    .order('started_at', { ascending: false })
    .limit(1);

  if (!logs || logs.length === 0) return;

  const usedStrategy = logs[0].decision_made;

  // 2. Get student for college + company context
  const { data: student } = await supabase
    .from('users')
    .select('college_id, confidence_score')
    .eq('id', studentId)
    .single();

  if (!student) return;

  const { data: reg } = await supabase
    .from('student_registrations')
    .select('*, campus_drives!inner(company_id)')
    .eq('student_id', studentId)
    .eq('drive_id', driveId)
    .single();

  if (!reg) return;

  const companyId = reg.campus_drives?.company_id;
  const score = student.confidence_score || 0.5;
  const profileType =
    score >= 0.7 ? 'HIGH_CONFIDENCE' : score >= 0.4 ? 'MEDIUM_CONFIDENCE' : 'LOW_CONFIDENCE';

  // 3. Upsert strategy weight
  const { data: existing } = await supabase
    .from('strategy_weights')
    .select('*')
    .eq('college_id', student.college_id)
    .eq('company_id', companyId)
    .eq('strategy', usedStrategy)
    .eq('student_profile_type', profileType)
    .single();

  const isSuccess = outcome === 'selected';
  const timesUsed = (existing?.times_used || 0) + 1;
  const timesSuccessful = (existing?.times_successful || 0) + (isSuccess ? 1 : 0);
  const winRate = timesSuccessful / timesUsed;

  // Exponential moving average for weight (recent outcomes matter more)
  const alpha = 0.3; // learning rate
  const currentWeight = existing?.weight || 1.0;
  const newWeight = currentWeight * (1 - alpha) + (isSuccess ? 1.5 : 0.5) * alpha;

  await supabase
    .from('strategy_weights')
    .upsert(
      {
        college_id: student.college_id,
        company_id: companyId,
        strategy: usedStrategy,
        student_profile_type: profileType,
        times_used: timesUsed,
        times_successful: timesSuccessful,
        win_rate: parseFloat(winRate.toFixed(3)),
        weight: parseFloat(newWeight.toFixed(4)),
        last_updated: new Date().toISOString(),
      },
      { onConflict: 'college_id,company_id,strategy,student_profile_type' }
    );

  console.log(
    `[Learner] Updated ${usedStrategy} for ${profileType}: win_rate=${winRate.toFixed(2)} weight=${newWeight.toFixed(2)}`
  );
}
