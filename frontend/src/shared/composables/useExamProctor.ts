import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { httpClient } from '../api/httpClient';

export interface ProctorViolationLog {
  timestamp: string;
  type: 'tab_hidden' | 'window_blur' | 'fullscreen_exit';
  message: string;
}

export interface ExamProctorTelemetryOptions {
  attemptId?: () => string | null;
  onForceSubmit?: () => void;
}

export function useExamProctor(maxViolations = 3, options?: ExamProctorTelemetryOptions) {
  const violationCount = ref(0);
  const isWarningModalOpen = ref(false);
  const lastWarningMessage = ref('');
  const isFullscreen = ref(false);
  const violationLogs = ref<ProctorViolationLog[]>([]);
  let isProctoringActive = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  const seenTeacherActionIds = new Set<string>();

  async function sendTelemetryEvent(
    eventType: string,
    severity: 'info' | 'warning' | 'high',
    message?: string
  ) {
    const attemptId = options?.attemptId?.();
    if (!attemptId) return;
    try {
      interface EventResponse {
        ok: boolean;
        status?: string;
        pendingActions?: Array<{ id: string; action: string; message?: string }>;
      }
      const res = await httpClient.post<EventResponse>(`/proctor/attempts/${attemptId}/event`, {
        eventType,
        severity,
        message,
      });
      if (res.status === 'submitted' && options?.onForceSubmit) {
        options.onForceSubmit();
      }
      for (const act of res.pendingActions || []) {
        if (!seenTeacherActionIds.has(act.id)) {
          seenTeacherActionIds.add(act.id);
          if (act.action === 'send_warning' && act.message) {
            lastWarningMessage.value = act.message;
            isWarningModalOpen.value = true;
          }
        }
      }
    } catch {
      // Telemetry failures must never interrupt the active exam
    }
  }

  function recordViolation(type: 'tab_hidden' | 'window_blur' | 'fullscreen_exit', message: string) {
    if (!isProctoringActive) return;

    violationCount.value++;
    lastWarningMessage.value = message;
    isWarningModalOpen.value = true;

    violationLogs.value.push({
      timestamp: new Date().toISOString(),
      type,
      message,
    });
    void sendTelemetryEvent(type, 'warning', message);
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      recordViolation(
        'tab_hidden',
        `Imtihon vkladkasidan chiqdingiz! (${violationCount.value + 1}/${maxViolations})`
      );
    }
  }

  function handleWindowBlur() {
    // Check if not already hidden to avoid double penalty on same tab change
    if (!document.hidden) {
      recordViolation(
        'window_blur',
        `Imtihon oynasidan boshqa dasturga o'tdingiz! (${violationCount.value + 1}/${maxViolations})`
      );
    }
  }

  function handleFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement;
    if (!isFullscreen.value && isProctoringActive) {
      recordViolation(
        'fullscreen_exit',
        `To'liq ekran rejimidan chiqdingiz! (${violationCount.value + 1}/${maxViolations})`
      );
    }
  }

  async function requestFullscreen(): Promise<boolean> {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        isFullscreen.value = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function dismissWarning() {
    isWarningModalOpen.value = false;
  }

  function startProctoring() {
    if (isProctoringActive) return;
    isProctoringActive = true;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    if (options?.attemptId) {
      void sendTelemetryEvent('heartbeat', 'info');
      heartbeatTimer = setInterval(() => {
        void sendTelemetryEvent('heartbeat', 'info');
      }, 15000);
    }
  }

  function stopProctoring() {
    isProctoringActive = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      // Ready for start
    });

    onUnmounted(() => {
      stopProctoring();
    });
  }

  return {
    violationCount,
    maxViolations,
    isWarningModalOpen,
    lastWarningMessage,
    isFullscreen,
    violationLogs,
    startProctoring,
    stopProctoring,
    requestFullscreen,
    dismissWarning,
    recordViolation,
  };
}
