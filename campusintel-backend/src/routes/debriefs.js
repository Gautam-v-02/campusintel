// src/routes/debriefs.js
import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { extractDebriefTopics } from '../lib/grok.js';

const router = Router();

// Submit a debrief
router.post('/', async (req, res) => {
  try {
    const {
      driveId,
      collegeId,
      companyId,
      roundType,
      questionsAsked,
      topicsCovered,
      outcome,
      difficultyRating,
      studentId,
    } = req.body;

    if (!questionsAsked || !outcome)
      return res.status(400).json({ error: 'questionsAsked and outcome required' });

    // Extract structured topics using Grok
    let extractedTopics = {};
    try {
      extractedTopics = await extractDebriefTopics(questionsAsked, roundType);
    } catch (err) {
      console.warn('[Debriefs] Topic extraction failed, using manual topics:', err.message);
      extractedTopics = { technical: topicsCovered || [], behavioral: [] };
    }

    // Insert debrief
    const { data: debrief, error } = await supabase
      .from('interview_debriefs')
      .insert({
        college_id: collegeId,
        company_id: companyId,
        student_id: studentId || null,
        drive_id: driveId || null,
        round_type: roundType,
        questions_asked: questionsAsked,
        topics_covered: topicsCovered || extractedTopics.technical || [],
        outcome,
        difficulty_rating: difficultyRating || 3,
        extracted_topics: extractedTopics,
        is_verified: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Resynthesize intel for this company
    await resynthesizeIntel(collegeId, companyId);

    // Get updated count
    const { count } = await supabase
      .from('interview_debriefs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    // Get latest topic synthesis
    const { data: intel } = await supabase
      .from('college_company_intel')
      .select('top_topics')
      .eq('college_id', collegeId)
      .eq('company_id', companyId)
      .single();

    const synthesizedTopics = (intel?.top_topics || []).map((t) => ({
      topic: t.topic,
      frequency: t.frequency,
    }));

    res.json({
      success: true,
      debrief,
      total_debriefs: count || 1,
      synthesized_topics: synthesizedTopics,
      message: `Intelligence updated from ${count} debriefs`,
    });
  } catch (err) {
    console.error('[Debriefs] Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get debriefs for a college + company
router.get('/:collegeId/:companyId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('interview_debriefs')
      .select('id, round_type, outcome, difficulty_rating, topics_covered, created_at')
      .eq('college_id', req.params.collegeId)
      .eq('company_id', req.params.companyId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Internal: Re-synthesize intel after new debrief ──────────
async function resynthesizeIntel(collegeId, companyId) {
  try {
    const { data: debriefs } = await supabase
      .from('interview_debriefs')
      .select('*')
      .eq('college_id', collegeId)
      .eq('company_id', companyId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!debriefs || debriefs.length === 0) return;

    const topicCounts = {};
    let selectedCount = 0;
    let totalRounds = 0;

    for (const d of debriefs) {
      totalRounds++;
      if (d.outcome === 'selected') selectedCount++;
      const topics = [
        ...(d.extracted_topics?.technical || []),
        ...(d.topics_covered || []),
      ];
      for (const topic of [...new Set(topics)]) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([topic, count], idx) => ({
        topic,
        frequency: parseFloat((count / debriefs.length).toFixed(2)),
        priority: idx + 1,
      }));

    const selectionRate =
      totalRounds > 0
        ? parseFloat((selectedCount / totalRounds).toFixed(2))
        : 0.5;

    await supabase
      .from('college_company_intel')
      .upsert(
        {
          college_id: collegeId,
          company_id: companyId,
          debrief_count: debriefs.length,
          local_debrief_count: debriefs.length,
          top_topics: topTopics,
          selection_rate: selectionRate,
          confidence_level:
            debriefs.length >= 10
              ? 'HIGH'
              : debriefs.length >= 5
              ? 'MEDIUM'
              : 'LOW',
          last_synthesized: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'college_id,company_id' }
      );
  } catch (err) {
    console.error('[Intel] Re-synthesis error:', err.message);
  }
}

export default router;
