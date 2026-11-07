import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import {
  LiveStudentSessionSchema,
  ProctorActionPayloadSchema,
  LiveEventStreamItemSchema,
  type LiveStudentSession,
} from '../src/entities/proctor/model';
import { useLiveProctorStore } from '../src/features/teacher/proctor/liveProctorStore';
import StudentLiveCard from '../src/features/teacher/proctor/components/StudentLiveCard.vue';
import ProctorActionModal from '../src/features/teacher/proctor/components/ProctorActionModal.vue';
import LiveAuditTimeline from '../src/features/teacher/proctor/components/LiveAuditTimeline.vue';
import TeacherLiveRoomView from '../src/features/teacher/proctor/TeacherLiveRoomView.vue';

describe('Direction 1: Live Exam Proctoring Room', () => {
  describe('TASK-LM.1: Telemetry Data Models & Zod Schemas', () => {
    it('validates a valid student live session telemetry payload', () => {
      const validSession: LiveStudentSession = {
        rosterRecordId: 'rec-ax-101',
        studentName: 'Alisher Zokirov',
        className: '11-A sinf',
        currentQuestion: 8,
        totalQuestions: 15,
        answeredCount: 7,
        remainingSeconds: 1450,
        status: 'active',
        violationsCount: 0,
        lastActiveAt: new Date().toISOString(),
      };

      const parsed = LiveStudentSessionSchema.safeParse(validSession);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.status).toBe('active');
        expect(parsed.data.currentQuestion).toBe(8);
      }
    });

    it('rejects invalid live session with negative remaining seconds or invalid status', () => {
      const invalid = {
        rosterRecordId: '',
        studentName: 'Test',
        className: '11-A',
        currentQuestion: 0,
        answeredCount: -1,
        remainingSeconds: -10,
        status: 'unknown_status',
        lastActiveAt: '',
      };

      const parsed = LiveStudentSessionSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('validates proctor action payloads (grant_time, send_warning, force_submit)', () => {
      const actionPayload = {
        studentId: 'rec-ax-101',
        action: 'grant_time',
        extraSeconds: 300,
        reason: 'Texnik aloqa uzilishi tufayli vaqt berildi',
        timestamp: new Date().toISOString(),
      };

      const parsed = ProctorActionPayloadSchema.safeParse(actionPayload);
      expect(parsed.success).toBe(true);
    });

    it('validates live event stream items with severity levels', () => {
      const eventItem = {
        id: 'evt-101',
        timestamp: new Date().toISOString(),
        studentName: 'Sardor Olimov',
        type: 'warning',
        message: 'Vkladkadan chiqish qayd etildi (1/3)',
        severity: 'warning',
      };

      const parsed = LiveEventStreamItemSchema.safeParse(eventItem);
      expect(parsed.success).toBe(true);
    });
  });

  describe('TASK-LM.2: Live Proctoring Store & State Machine', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it('initializes with mock sessions and accurate aggregated counts', () => {
      const store = useLiveProctorStore();

      expect(store.totalCount).toBeGreaterThanOrEqual(8);
      expect(store.activeCount).toBeGreaterThan(0);
      expect(store.warningCount).toBeGreaterThan(0);
      expect(store.offlineCount).toBeGreaterThan(0);
      expect(store.submittedCount).toBeGreaterThan(0);
      expect(store.filteredSessions.length).toBe(store.totalCount);
    });

    it('filters sessions by status (all, warning, offline, submitted)', () => {
      const store = useLiveProctorStore();

      store.setStatusFilter('warning');
      expect(store.filteredSessions.every((s) => s.status === 'warning')).toBe(true);

      store.setStatusFilter('offline');
      expect(store.filteredSessions.every((s) => s.status === 'offline')).toBe(true);

      store.setStatusFilter('all');
      expect(store.filteredSessions.length).toBe(store.totalCount);
    });

    it('filters sessions by search query (student name or class)', () => {
      const store = useLiveProctorStore();

      store.setSearchQuery('Alisher');
      expect(store.filteredSessions).toHaveLength(1);
      expect(store.filteredSessions[0]?.studentName).toBe('Alisher Zokirov');

      store.setSearchQuery('not-found-query');
      expect(store.filteredSessions).toHaveLength(0);

      store.setSearchQuery('');
      expect(store.filteredSessions.length).toBe(store.totalCount);
    });

    it('grants extra time to a student and logs proctor action', () => {
      const store = useLiveProctorStore();
      const studentId = 'rec-ax-101';
      const initialSeconds = store.sessions.find((s) => s.rosterRecordId === studentId)!.remainingSeconds;

      store.grantExtraTime(studentId, 300, 'Aloqa tiklandi');

      const updated = store.sessions.find((s) => s.rosterRecordId === studentId);
      expect(updated?.remainingSeconds).toBe(initialSeconds + 300);
      expect(store.actionHistory).toHaveLength(1);
      expect(store.actionHistory[0]?.action).toBe('grant_time');
      expect(store.actionHistory[0]?.extraSeconds).toBe(300);
      expect(store.eventStream[0]?.type).toBe('action');
    });

    it('sends proctor warning and switches student status to warning', () => {
      const store = useLiveProctorStore();
      const studentId = 'rec-ax-101';

      store.sendWarning(studentId, 'Iltimos, vkladkadan chiqmang!');

      const updated = store.sessions.find((s) => s.rosterRecordId === studentId);
      expect(updated?.status).toBe('warning');
      expect(updated?.violationsCount).toBe(1);
      expect(store.eventStream[0]?.type).toBe('warning');
      expect(store.eventStream[0]?.message).toContain('Iltimos, vkladkadan chiqmang!');
    });

    it('forces submission / disqualification of a session', () => {
      const store = useLiveProctorStore();
      const studentId = 'rec-ax-103';

      store.forceSubmit(studentId, 'Qoidabuzarlik chegarasi oshdi (3/3)');

      const updated = store.sessions.find((s) => s.rosterRecordId === studentId);
      expect(updated?.status).toBe('submitted');
      expect(updated?.remainingSeconds).toBe(0);
      expect(store.actionHistory.some((a) => a.action === 'force_submit')).toBe(true);
    });
  });

  describe('TASK-LM.3: Student Live Card Component', () => {
    const mockSession: LiveStudentSession = {
      rosterRecordId: 'rec-ax-103',
      studentName: 'Jasur Bekmurodov',
      className: '11-A sinf',
      currentQuestion: 6,
      totalQuestions: 15,
      answeredCount: 5,
      remainingSeconds: 1200,
      status: 'warning',
      violationsCount: 2,
      lastActiveAt: new Date().toISOString(),
    };

    it('renders student name, class, progress, and warning indicator', () => {
      const wrapper = mount(StudentLiveCard, {
        props: {
          session: mockSession,
        },
      });

      expect(wrapper.text()).toContain('Jasur Bekmurodov');
      expect(wrapper.text()).toContain('11-A sinf');
      expect(wrapper.text()).toContain('6/15');
      expect(wrapper.text()).toContain('5/15');
      expect(wrapper.text()).toContain('20:00'); // 1200 seconds
      expect(wrapper.text()).toContain('Xavf ostida');
      expect(wrapper.text()).toContain('Ogohlantirish: 2/3');
    });

    it('emits action events when proctor buttons are clicked', async () => {
      const wrapper = mount(StudentLiveCard, {
        props: {
          session: mockSession,
        },
      });

      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);

      // 1. Grant time
      await buttons[0]?.trigger('click');
      expect(wrapper.emitted('action')).toBeTruthy();
      expect(wrapper.emitted('action')![0]).toEqual(['rec-ax-103', 'grant_time']);

      // 2. Send warning
      await buttons[1]?.trigger('click');
      expect(wrapper.emitted('action')![1]).toEqual(['rec-ax-103', 'send_warning']);

      // 3. Force submit
      await buttons[2]?.trigger('click');
      expect(wrapper.emitted('action')![2]).toEqual(['rec-ax-103', 'force_submit']);
    });
  });

  describe('TASK-LM.4: Action Modals & Audit Timeline Components', () => {
    const mockStudent: LiveStudentSession = {
      rosterRecordId: 'rec-ax-101',
      studentName: 'Alisher Zokirov',
      className: '11-A sinf',
      currentQuestion: 8,
      totalQuestions: 15,
      answeredCount: 7,
      remainingSeconds: 1500,
      status: 'active',
      violationsCount: 0,
      lastActiveAt: new Date().toISOString(),
    };

    it('renders grant time modal with options and emits payload', async () => {
      const wrapper = mount(ProctorActionModal, {
        props: {
          isOpen: true,
          actionType: 'grant_time',
          student: mockStudent,
        },
      });

      expect(wrapper.text()).toContain("Qo'shimcha Vaqt Berish");
      expect(wrapper.text()).toContain('Alisher Zokirov');

      const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Tasdiqlash');
      expect(confirmBtn?.exists()).toBe(true);
      await confirmBtn?.trigger('click');

      expect(wrapper.emitted('confirm')).toBeTruthy();
      const emittedPayload = wrapper.emitted('confirm')![0]![0] as { extraSeconds: number; reason: string };
      expect(emittedPayload.extraSeconds).toBe(300); // 5 minutes default
    });

    it('renders force submit modal with warning and emits payload', async () => {
      const wrapper = mount(ProctorActionModal, {
        props: {
          isOpen: true,
          actionType: 'force_submit',
          student: mockStudent,
        },
      });

      expect(wrapper.text()).toContain('Imtihondan Majburiy Chetlatish');
      expect(wrapper.text()).toContain('Diqqat!');

      const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Tasdiqlash');
      await confirmBtn?.trigger('click');

      expect(wrapper.emitted('confirm')).toBeTruthy();
      const emittedPayload = wrapper.emitted('confirm')![0]![0] as { reason: string };
      expect(emittedPayload.reason).toBe('Qoidabuzarlik chegarasi oshganligi sababli');
    });

    it('renders live audit timeline with formatted event list', () => {
      const events = [
        {
          id: 'e-1',
          timestamp: new Date().toISOString(),
          studentName: 'Madina',
          type: 'warning' as const,
          message: 'Boshqa oynaga o\'tdi',
          severity: 'warning' as const,
        },
      ];

      const wrapper = mount(LiveAuditTimeline, {
        props: { events },
      });

      expect(wrapper.text()).toContain('Jonli Hodisalar Jurnali');
      expect(wrapper.text()).toContain('Madina');
      expect(wrapper.text()).toContain('Boshqa oynaga o\'tdi');
    });
  });

  describe('TASK-LM.5: Teacher Live Room View & Route Integration', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    const mountView = () =>
      mount(TeacherLiveRoomView, {
        global: {
          stubs: {
            'router-link': true,
          },
          mocks: {
            $route: { params: { tenantSlug: 'al-xorazmiy', assessmentId: 'chsb-inf-11-q1' } },
          },
          provide: {
            'Symbol(route location)': { params: { tenantSlug: 'al-xorazmiy', assessmentId: 'chsb-inf-11-q1' } },
          },
        },
      });

    it('mounts the live room view and renders student cards and audit timeline', () => {
      const wrapper = mountView();

      expect(wrapper.text()).toContain('Jonli Nazorat Zali');
      expect(wrapper.text()).toContain('Informatika va axborot texnologiyalari');
      expect(wrapper.findAllComponents(StudentLiveCard).length).toBeGreaterThan(0);
      expect(wrapper.findComponent(LiveAuditTimeline).exists()).toBe(true);
    });

    it('filters student cards when status filter pills are clicked', async () => {
      const wrapper = mountView();

      const warningFilterBtn = wrapper.findAll('button').find((b) => b.text().includes('Xavf ostida'));
      expect(warningFilterBtn?.exists()).toBe(true);
      await warningFilterBtn?.trigger('click');

      const cards = wrapper.findAllComponents(StudentLiveCard);
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => {
        expect(card.props('session').status).toBe('warning');
      });
    });

    it('opens action modal when a student card triggers action', async () => {
      const wrapper = mountView();

      const firstCard = wrapper.findComponent(StudentLiveCard);
      firstCard.vm.$emit('action', firstCard.props('session').rosterRecordId, 'grant_time');
      await wrapper.vm.$nextTick();

      const modal = wrapper.findComponent(ProctorActionModal);
      expect(modal.exists()).toBe(true);
      expect(modal.props('isOpen')).toBe(true);
      expect(modal.props('actionType')).toBe('grant_time');
    });
  });
});
