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

  it('invokes onGrantTime and onForceSubmit callbacks when teacher actions arrive in pendingActions', async () => {
    const onGrantTime = vi.fn();
    const onForceSubmit = vi.fn();
    vi.spyOn(httpClient, 'post').mockResolvedValue({
      ok: true,
      status: 'in_progress',
      pendingActions: [
        { id: 'act-1', action: 'grant_time', message: '+5 daqiqa berildi', extra: { extraSeconds: 300 } },
        { id: 'act-2', action: 'force_submit', message: 'Yakunlandi' },
      ],
    });

    const proctor = useExamProctor(3, {
      attemptId: () => 'att-telemetry-2',
      onGrantTime,
      onForceSubmit,
    });
    proctor.startProctoring();
    await new Promise((r) => setTimeout(r, 10));

    expect(onGrantTime).toHaveBeenCalledWith(300, '+5 daqiqa berildi');
    expect(onForceSubmit).toHaveBeenCalledTimes(1);
    proctor.stopProctoring();
  });
});

