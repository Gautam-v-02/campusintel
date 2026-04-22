// src/routes/drives.js
import { Router } from 'express';
import supabase from '../lib/supabase.js';

const router = Router();

// Get drives for a college
router.get('/:collegeId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campus_drives')
      .select('*, companies(id, name, website, normalized_name)')
      .eq('college_id', req.params.collegeId)
      .gte('drive_date', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
      .order('drive_date', { ascending: true });

    if (error) throw error;

    const drives = (data || []).map((d) => ({
      ...d,
      company: d.companies,
      registration_status: 'upcoming',
    }));

    res.json(drives);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get drive detail
router.get('/:driveId/detail', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campus_drives')
      .select('*, companies(*), college_company_intel(*)')
      .eq('id', req.params.driveId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register student for drive
router.post('/:driveId/register', async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId)
      return res.status(400).json({ error: 'studentId required' });

    const { data: drive } = await supabase
      .from('campus_drives')
      .select('college_id')
      .eq('id', req.params.driveId)
      .single();

    if (!drive) return res.status(404).json({ error: 'Drive not found' });

    const { data, error } = await supabase
      .from('student_registrations')
      .upsert(
        {
          student_id: studentId,
          drive_id: req.params.driveId,
          college_id: drive.college_id,
          status: 'registered',
          registered_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,drive_id' }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, registration: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get registrations for a drive
router.get('/:driveId/registrations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .select('*, users(id, name, branch, cgpa, confidence_score, current_state)')
      .eq('drive_id', req.params.driveId);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
