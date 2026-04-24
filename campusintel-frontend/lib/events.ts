// campusintel-frontend/lib/events.ts
export function emitDebriefUpdated(detail?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ci:debrief-submitted', { detail }));
  }
}

export function subscribeDebriefUpdates(callback: (event: CustomEvent) => void) {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (e: Event) => callback(e as CustomEvent);
  window.addEventListener('ci:debrief-submitted', handler);
  
  return () => {
    window.removeEventListener('ci:debrief-submitted', handler);
  };
}
