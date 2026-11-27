import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useExamProctor } from '@/shared/composables/useExamProctor';
import { useLiveProctorStore } from '@/features/teacher/proctor/liveProctorStore';
import { httpClient } from '@/shared/api/httpClient';

describe('Proctor Backend Telemetry Integration (TASK-3.3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('sends violation telemetry event to backend when attemptId option is provided', async () => {
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValue({
      ok: true,
      status: 'in_progress',
      pendingActions: [],
    });

    const proctor = useExamProctor(3, {
      attemptId: () => 'att-telemetry-1',
    });
    proctor.startProctoring();

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(proctor.violationCount.value).toBe(1);
    expect(postSpy).toHaveBeenCalledWith(
      '/proctor/attempts/att-telemetry-1/event',
      expect.objectContaining({ eventType: 'tab_hidden', severity: 'warning' })
    );

    proctor.stopProctoring();
  });

  it('liveProctorStore maintains reactive state across actions', () => {
    const store = useLiveProctorStore();
    expect(store.sessions.length).toBeGreaterThan(0);
    const target = store.sessions[0]!;
    store.sendWarning(target.rosterRecordId, 'Diqqat!');
    expect(target.status).toBe('warning');
  });
});

