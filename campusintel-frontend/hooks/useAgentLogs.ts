'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export interface AgentLog {
  id: string;
  step_number: number;
  step_name: string;
  decision_basis: string;
  decision_made: string;
  duration_ms: number;
  status: 'success' | 'failed' | 'skipped' | 'fallback_triggered';
  output: Record<string, unknown>;
  started_at: string;
}

export function useAgentLogs(sessionId: string | null) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLogs([]);

    // Primary: Supabase Realtime WebSocket
    const channel = supabase
      .channel('agent-logs-' + sessionId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_logs',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setLogs(prev => {
          const exists = prev.find(l => l.id === payload.new.id);
          if (exists) return prev;
          return [...prev, payload.new as AgentLog].sort((a, b) => a.step_number - b.step_number);
        });
      })
      .subscribe((status) => {
        setWsConnected(status === 'SUBSCRIBED');
      });

    // Fallback: poll every 1.5s if WS drops (venue WiFi risk)
    pollRef.current = setInterval(async () => {
      if (!wsConnected) {
        try {
          const data = await api.getAgentLogs(sessionId);
          if (Array.isArray(data)) setLogs(data);
        } catch { /* ignore */ }
      }
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId]);

  return { logs, wsConnected };
}
