// src/routes/agent.js
import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { runAgentLoop } from '../agent/reactor.js';

const router = Router();

// Trigger agent for a specific student + drive
router.post('/trigger', async (req, res) => {
  try {
    const { studentId, driveId } = req.body;
    if (!studentId || !driveId)
      return res.status(400).json({ error: 'studentId and driveId required' });

    const { data: student } = await supabase
      .from('users')
      .select('college_id')
      .eq('id', studentId)
      .single();

    if (!student)
      return res.status(404).json({ error: 'Student not found' });

    // Run async — don't await
    const sessionId = crypto.randomUUID();
    runAgentLoop({
      studentId,
      driveId,
      collegeId: student.college_id,
    }).catch((err) => console.error('[Agent] Loop error:', err));

    res.json({ status: 'triggered', sessionId, message: 'Agent started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger demo (uses first registered student + first upcoming drive)
router.post('/trigger-demo', async (req, res) => {
  try {
    // Get a real student with a registration
    const { data: reg } = await supabase
      .from('student_registrations')
      .select('student_id, drive_id, college_id')
      .eq('status', 'registered')
      .order('registered_at', { ascending: false })
      .limit(1)
      .single();

    let studentId = reg?.student_id || 'demo-student-rahul';
    let driveId = reg?.drive_id || 'demo-drive-google';
    let collegeId = reg?.college_id || 'college-lpu-001';

    // If demo-student doesn't exist, try to find any student
    if (!reg) {
      const { data: anyStudent } = await supabase
        .from('users')
        .select('id, college_id')
        .eq('role', 'student')
        .limit(1)
        .single();
      if (anyStudent) {
        studentId = anyStudent.id;
        collegeId = anyStudent.college_id;
      }

      const { data: anyDrive } = await supabase
        .from('campus_drives')
        .select('id')
        .eq('college_id', collegeId)
        .limit(1)
        .single();
      if (anyDrive) driveId = anyDrive.id;
    }

    const result = await runAgentLoop({ studentId, driveId, collegeId });

    res.json({
      status: 'triggered',
      sessionId: result.sessionId,
      studentId,
      driveId,
    });
  } catch (err) {
    console.error('[Agent] Demo trigger error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get logs for a session (polling fallback if WebSocket drops)
router.get('/logs/:sessionId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('session_id', req.params.sessionId)
      .order('step_number', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent agent status
router.get('/status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agent_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const recentSteps = data || [];
    res.json({ recent_steps: recentSteps, status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
