import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  LiveStudentSession,
  LiveEventStreamItem,
  ProctorActionPayload,
} from '../../../entities/proctor/model';

const initialMockSessions: LiveStudentSession[] = [
  {
    rosterRecordId: 'rec-ax-101',
    studentName: 'Alisher Zokirov',
    className: '11-A sinf',
    currentQuestion: 9,
    totalQuestions: 15,
    answeredCount: 8,
    remainingSeconds: 1540,
    status: 'active',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-102',
    studentName: 'Barno Karimova',
    className: '11-A sinf',
    currentQuestion: 12,
    totalQuestions: 15,
    answeredCount: 12,
    remainingSeconds: 1200,
    status: 'active',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-103',
    studentName: 'Jasur Bekmurodov',
    className: '11-A sinf',
    currentQuestion: 6,
    totalQuestions: 15,
    answeredCount: 5,
    remainingSeconds: 1400,
    status: 'warning',
    violationsCount: 2,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-104',
    studentName: 'Dilnoza Rustamova',
    className: '11-A sinf',
    currentQuestion: 15,
    totalQuestions: 15,
    answeredCount: 15,
    remainingSeconds: 0,
    status: 'submitted',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-105',
    studentName: 'Otabek G\'aniyev',
    className: '11-A sinf',
    currentQuestion: 4,
    totalQuestions: 15,
    answeredCount: 3,
    remainingSeconds: 1600,
    status: 'offline',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-106',
    studentName: 'Madina Shokirova',
    className: '11-A sinf',
    currentQuestion: 7,
    totalQuestions: 15,
    answeredCount: 6,
    remainingSeconds: 1350,
    status: 'idle',
    violationsCount: 1,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-107',
    studentName: 'Sarvar Qodirov',
    className: '11-A sinf',
    currentQuestion: 11,
    totalQuestions: 15,
    answeredCount: 10,
    remainingSeconds: 1100,
    status: 'active',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-108',
    studentName: 'Feruza Ergasheva',
    className: '11-A sinf',
    currentQuestion: 8,
    totalQuestions: 15,
    answeredCount: 7,
    remainingSeconds: 1390,
    status: 'warning',
    violationsCount: 1,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-109',
    studentName: 'Shaxzod Rahimov',
    className: '11-B sinf',
    currentQuestion: 14,
    totalQuestions: 15,
    answeredCount: 13,
    remainingSeconds: 980,
    status: 'active',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-110',
    studentName: 'Sevara Mahmudova',
    className: '11-B sinf',
    currentQuestion: 15,
    totalQuestions: 15,
    answeredCount: 15,
    remainingSeconds: 0,
    status: 'submitted',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-111',
    studentName: 'Bobur Mirzayev',
    className: '11-B sinf',
    currentQuestion: 5,
    totalQuestions: 15,
    answeredCount: 4,
    remainingSeconds: 1450,
    status: 'idle',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
  {
    rosterRecordId: 'rec-ax-112',
    studentName: 'Zarina Sobirova',
    className: '11-V sinf',
    currentQuestion: 10,
    totalQuestions: 15,
    answeredCount: 9,
    remainingSeconds: 1150,
    status: 'active',
    violationsCount: 0,
    lastActiveAt: new Date().toISOString(),
  },
];

export const useLiveProctorStore = defineStore('liveProctor', () => {
  const sessions = ref<LiveStudentSession[]>(JSON.parse(JSON.stringify(initialMockSessions)));
  const eventStream = ref<LiveEventStreamItem[]>([
    {
      id: 'evt-1',
      timestamp: new Date().toISOString(),
      studentName: 'Dilnoza Rustamova',
      type: 'submission',
      message: 'Imtihonni muvaffaqiyatli topshirdi (15/15)',
      severity: 'info',
    },
    {
      id: 'evt-2',
      timestamp: new Date().toISOString(),
      studentName: 'Jasur Bekmurodov',
      type: 'warning',
      message: 'Vkladkadan chiqish qayd etildi (2/3)',
      severity: 'warning',
    },
    {
      id: 'evt-3',
      timestamp: new Date().toISOString(),
      studentName: 'Otabek G\'aniyev',
      type: 'offline',
      message: 'Qurilma oflayn rejimga o\'tdi',
      severity: 'warning',
    },
  ]);

  const activeStatusFilter = ref<string>('all');
  const searchQuery = ref<string>('');
  const actionHistory = ref<ProctorActionPayload[]>([]);

  // Computed counts
  const totalCount = computed(() => sessions.value.length);
  const activeCount = computed(
    () => sessions.value.filter((s) => s.status === 'active' || s.status === 'idle').length
  );
  const warningCount = computed(
    () => sessions.value.filter((s) => s.status === 'warning').length
  );
  const offlineCount = computed(
    () => sessions.value.filter((s) => s.status === 'offline').length
  );
  const submittedCount = computed(
    () => sessions.value.filter((s) => s.status === 'submitted').length
  );

  const filteredSessions = computed(() => {
    return sessions.value.filter((s) => {
      // Status filter
      if (activeStatusFilter.value !== 'all' && s.status !== activeStatusFilter.value) {
        return false;
      }
      // Search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        return (
          s.studentName.toLowerCase().includes(query) ||
          s.className.toLowerCase().includes(query)
        );
      }
      return true;
    });
  });

  function setStatusFilter(status: string) {
    activeStatusFilter.value = status;
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function pushEvent(item: Omit<LiveEventStreamItem, 'id' | 'timestamp'>) {
    const newItem: LiveEventStreamItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...item,
    };
    eventStream.value.unshift(newItem);
    if (eventStream.value.length > 50) {
      eventStream.value.pop();
    }
  }

  function grantExtraTime(studentId: string, extraSeconds: number, reason: string) {
    const session = sessions.value.find((s) => s.rosterRecordId === studentId);
    if (session) {
      session.remainingSeconds += extraSeconds;
      const action: ProctorActionPayload = {
        studentId,
        action: 'grant_time',
        extraSeconds,
        reason,
        timestamp: new Date().toISOString(),
      };
      actionHistory.value.push(action);

      pushEvent({
        studentName: session.studentName,
        type: 'action',
        message: `O'qituvchi tomonidan +${Math.round(extraSeconds / 60)} daqiqa vaqt qo'shildi (${reason})`,
        severity: 'info',
      });
    }
  }

  function sendWarning(studentId: string, message: string) {
    const session = sessions.value.find((s) => s.rosterRecordId === studentId);
    if (session) {
      session.violationsCount++;
      session.status = 'warning';

      const action: ProctorActionPayload = {
        studentId,
        action: 'send_warning',
        warningMessage: message,
        reason: 'O\'qituvchi shaxsiy ogohlantirishi',
        timestamp: new Date().toISOString(),
      };
      actionHistory.value.push(action);

      pushEvent({
        studentName: session.studentName,
        type: 'warning',
        message: `O'qituvchi ogohlantirish yubordi: "${message}"`,
        severity: 'warning',
      });
    }
  }

  function forceSubmit(studentId: string, reason: string) {
    const session = sessions.value.find((s) => s.rosterRecordId === studentId);
    if (session) {
      session.status = 'submitted';
      session.remainingSeconds = 0;

      const action: ProctorActionPayload = {
        studentId,
        action: 'force_submit',
        reason,
        timestamp: new Date().toISOString(),
      };
      actionHistory.value.push(action);

      pushEvent({
        studentName: session.studentName,
        type: 'action',
        message: `Imtihon majburiy yakunlandi: ${reason}`,
        severity: 'danger',
      });
    }
  }

  function updateStudentTelemetry(
    studentId: string,
    updates: Partial<Pick<LiveStudentSession, 'currentQuestion' | 'answeredCount' | 'status' | 'violationsCount'>>
  ) {
    const session = sessions.value.find((s) => s.rosterRecordId === studentId);
    if (session) {
      Object.assign(session, updates, { lastActiveAt: new Date().toISOString() });
    }
  }

  function resetSessions() {
    sessions.value = JSON.parse(JSON.stringify(initialMockSessions));
    actionHistory.value = [];
  }

  return {
    sessions,
    eventStream,
    activeStatusFilter,
    searchQuery,
    actionHistory,
    totalCount,
    activeCount,
    warningCount,
    offlineCount,
    submittedCount,
    filteredSessions,
    setStatusFilter,
    setSearchQuery,
    pushEvent,
    grantExtraTime,
    sendWarning,
    forceSubmit,
    updateStudentTelemetry,
    resetSessions,
  };
});
