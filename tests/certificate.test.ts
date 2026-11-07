import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { generateQrMatrix, generateQrSvg } from '../src/shared/utils/qrGenerator';
import QrCodeRenderer from '../src/shared/components/QrCodeRenderer.vue';
import CertificateModal from '../src/features/results/CertificateModal.vue';
import type { AssessmentResult } from '../src/entities/result/model';

describe('Direction 4: QR-verified Official PDF Certificate Engine', () => {
  describe('Pure TypeScript QR Matrix Generator', () => {
    it('generates a valid square matrix with finder patterns', () => {
      const matrix = generateQrMatrix('https://chsb.uz/verify/CHSB-CERT-2026-REG890');

      expect(matrix.length).toBeGreaterThanOrEqual(29);
      expect(matrix[0]?.length).toBe(matrix.length);

      // Top-left finder pattern core (center 3x3 must be true)
      expect(matrix[3]?.[3]).toBe(true);
      expect(matrix[2]?.[2]).toBe(true);
    });

    it('generates crisp SVG markup with custom size and styling', () => {
      const svg = generateQrSvg('CHSB-CERT-999', {
        size: 180,
        color: '#064e3b',
        backgroundColor: '#f8fafc',
      });

      expect(svg).toContain('<svg');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('width="180"');
      expect(svg).toContain('height="180"');
      expect(svg).toContain('fill="#064e3b"');
      expect(svg).toContain('fill="#f8fafc"');
      expect(svg).toContain('shape-rendering="crispEdges"');
    });
  });

  describe('QrCodeRenderer Component', () => {
    it('mounts and displays QR SVG', () => {
      const wrapper = mount(QrCodeRenderer, {
        props: {
          value: 'CHSB-TEST-QR-VALUE',
          size: 120,
        },
      });

      expect(wrapper.find('svg').exists()).toBe(true);
      expect(wrapper.attributes('title')).toBe('QR Code: CHSB-TEST-QR-VALUE');
    });
  });

  describe('CertificateModal Component', () => {
    const mockResult: AssessmentResult = {
      attemptId: 'att-ax101-demo',
      tenantId: 'tenant-al-xorazmiy',
      assessmentId: 'chsb-inf-11-q1',
      rosterRecordId: 'rec-ax-101',
      studentName: 'Alisher Zokirov',
      className: '11-A sinf',
      totalQuestions: 15,
      answeredQuestions: 15,
      score: 38.0,
      maxScore: 40.0,
      percentage: 95.0,
      status: 'provisional_demo',
      verifiedByTeacher: true,
      submittedAt: '2026-11-06T15:00:00.000Z',
      teacherNote: 'A\'lo natija!',
    };

    it('renders official certificate data with correct serial and grade level', () => {
      const wrapper = mount(CertificateModal, {
        props: {
          isOpen: true,
          result: mockResult,
          schoolName: 'Al-Xorazmiy nomidagi IDUM',
        },
      });

      expect(wrapper.text()).toContain('Sertifikat');
      expect(wrapper.text()).toContain('Alisher Zokirov');
      expect(wrapper.text()).toContain('Al-Xorazmiy nomidagi IDUM');
      expect(wrapper.text()).toContain('11-A sinf');
      expect(wrapper.text()).toContain('38 / 40');
      expect(wrapper.text()).toContain('95%');
      expect(wrapper.text()).toContain("A'lo (I darajali)");
      expect(wrapper.text()).toContain('CHSB-CERT-2026-');

      // Verify QR Code renderer is mounted
      expect(wrapper.findComponent(QrCodeRenderer).exists()).toBe(true);
    });

    it('emits close event when close button is clicked', async () => {
      const wrapper = mount(CertificateModal, {
        props: {
          isOpen: true,
          result: mockResult,
        },
      });

      const closeBtn = wrapper.find('button[title="Yopish"]');
      expect(closeBtn.exists()).toBe(true);
      await closeBtn.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});
