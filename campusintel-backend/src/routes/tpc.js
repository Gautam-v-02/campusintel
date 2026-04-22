// src/routes/tpc.js
import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { updateStrategyWeights } from '../agent/learner.js';

const router = Router();

// Get all students for a college
router.get('/students/:collegeId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, branch, cgpa, current_state, confidence_score, inferred_skills, email, batch_year')
      .eq('college_id', req.params.collegeId)
      .eq('role', 'student')
      .order('confidence_score', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get TPC alerts for a college
router.get('/alerts/:collegeId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('college_id', req.params.collegeId)
      .eq('notification_type', 'tpc_alert')
      .order('sent_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get strategy weights
router.get('/strategy-weights/:collegeId/:companyId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('strategy_weights')
      .select('*')
      .eq('college_id', req.params.collegeId)
      .eq('company_id', req.params.companyId)
      .order('weight', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get briefs for a student
router.get('/briefs/:studentId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('skill_assessments')
      .select('*')
      .eq('student_id', req.params.studentId)
      .eq('topic_assessed', 'FULL_BRIEF')
      .order('completed_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record outcome (triggers RL weight update)
router.post('/record-outcome', async (req, res) => {
  try {
    const { studentId, driveId, outcome } = req.body;
    if (!studentId || !driveId || !outcome)
      return res.status(400).json({ error: 'studentId, driveId, outcome required' });

    if (!['selected', 'rejected', 'waiting', 'withdrew'].includes(outcome))
      return res.status(400).json({ error: 'Invalid outcome value' });

    // Update registration
    const { error: regError } = await supabase
      .from('student_registrations')
      .update({
        status: outcome === 'selected' ? 'selected' : outcome === 'rejected' ? 'rejected' : 'appeared',
        outcome_recorded_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
      .eq('drive_id', driveId);

    if (regError) throw regError;

    // Update student state
    await supabase
      .from('users')
      .update({ current_state: 'POST_INTERVIEW', updated_at: new Date().toISOString() })
      .eq('id', studentId);

    // Trigger RL weight update
    await updateStrategyWeights({ studentId, driveId, outcome });

    res.json({ success: true, message: `Outcome recorded: ${outcome}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
