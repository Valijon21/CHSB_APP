import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ConfirmPurgeModal from '../src/features/organization/components/ConfirmPurgeModal.vue';
import { useOrganizationStore } from '../src/features/organization/store/organizationStore';
import { useTeacherStore } from '../src/features/teacher/teacherStore';
import { parseSmartTableText, isBinaryText } from '../src/features/organization/services/smartTableTextParser';

describe('Admin Class Management & Purge System', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('ConfirmPurgeModal Component', () => {
    it('renders delete modal with correct title, description, and target name', () => {
      const wrapper = mount(ConfirmPurgeModal, {
        props: {
          isOpen: true,
          title: "Sinfni Butunlay O'chirish",
          description: "10-A sinfini va unga tegishli barcha o'quvchilarni o'chirilsinmi?",
          targetName: '10-A sinf',
          confirmButtonText: "Ha, Sinfni O'chirish",
          danger: true,
        },
      });

      expect(wrapper.text()).toContain("Sinfni Butunlay O'chirish");
      expect(wrapper.text()).toContain('10-A sinf');
      expect(wrapper.text()).toContain("Ha, Sinfni O'chirish");
      expect(wrapper.find('button.bg-rose-600').exists()).toBe(true);
    });

    it('emits confirm when action button is clicked', async () => {
      const wrapper = mount(ConfirmPurgeModal, {
        props: {
          isOpen: true,
          title: "O'quvchilarni Tozalash",
          description: "Ro'yxat 0 ga tushirilsinmi?",
          targetName: '11-B sinf',
          confirmButtonText: "Ha, Tozalansin",
          danger: false,
        },
      });

      const confirmBtn = wrapper.find('button.bg-amber-600');
      expect(confirmBtn.exists()).toBe(true);
      await confirmBtn.trigger('click');

      expect(wrapper.emitted('confirm')).toHaveLength(1);
    });

    it('emits close when cancel button is clicked', async () => {
      const wrapper = mount(ConfirmPurgeModal, {
        props: {
          isOpen: true,
          title: 'Tasdiqlash',
          description: 'Sinov',
        },
      });

      const cancelBtn = wrapper.findAll('button').find((b) => b.text().includes('Bekor qilish'));
      expect(cancelBtn).toBeDefined();
      await cancelBtn!.trigger('click');

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('OrganizationStore Purge & Delete Actions', () => {
    it('deletes class group and cascades roster cleanup in teacher store', async () => {
      const orgStore = useOrganizationStore();
      const teacherStore = useTeacherStore();

      // Create class properly via store
      const createdCls = await orgStore.createClassGroup({
        schoolId: 'sch-01',
        tenantSlug: 'al-xorazmiy',
        name: '10-A',
        gradeLevel: 10,
        shift: 1,
        academicYear: '2026-2027',
      });

      orgStore.students = [
        {
          id: 'stu-1',
          tenantSlug: 'al-xorazmiy',
          schoolId: 'sch-01',
          classGroupId: createdCls.id,
          className: '10-A',
          rosterCode: 'R-01',
          fullName: 'Valiyev Ali',
          firstName: 'Ali',
          lastName: 'Valiyev',
          gender: 'M',
          birthDate: '2009-01-01',
          status: 'eligible',
          createdAt: new Date().toISOString(),
        },
      ];

      teacherStore.classes = [
        {
          id: createdCls.id,
          tenantId: 'al-xorazmiy',
          schoolId: 'sch-01',
          name: '10-A',
          grade: 10,
          academicYear: '2026-2027',
          studentCount: 2,
        },
      ];

      const res = await orgStore.deleteClassGroup(createdCls.id);
      expect(res).toBe(true);
      expect(orgStore.classGroups.find((c) => c.id === createdCls.id)).toBeUndefined();
      expect(orgStore.students.find((s) => s.classGroupId === createdCls.id)).toBeUndefined();
      expect(teacherStore.classes.find((c) => c.id === createdCls.id)).toBeUndefined();
    });

    it('purges class students and resets studentCount to 0', async () => {
      const orgStore = useOrganizationStore();

      orgStore.classGroups = [
        {
          id: 'test-cls-2',
          schoolId: 'sch-01',
          tenantSlug: 'al-xorazmiy',
          name: '11-A',
          gradeLevel: 11,
          shift: 1,
          academicYear: '2026-2027',
          studentCount: 5,
          createdAt: new Date().toISOString(),
        },
      ];

      orgStore.students = [
        {
          id: 'stu-2',
          tenantSlug: 'al-xorazmiy',
          schoolId: 'sch-01',
          classGroupId: 'test-cls-2',
          className: '11-A',
          rosterCode: 'R-02',
          fullName: 'Karimova Zahro',
          firstName: 'Zahro',
          lastName: 'Karimova',
          gender: 'F',
          birthDate: '2008-05-12',
          status: 'eligible',
          createdAt: new Date().toISOString(),
        },
      ];

      const res = await orgStore.purgeClassStudents('test-cls-2');
      expect(res.success).toBe(true);
      expect(orgStore.students.filter((s) => s.classGroupId === 'test-cls-2')).toHaveLength(0);
      expect(orgStore.classGroups.find((c) => c.id === 'test-cls-2')?.studentCount).toBe(0);
    });
  });

  describe('Smart Table & Binary Text Protection', () => {
    const context = {
      tenantSlug: 'al-xorazmiy',
      schoolId: 'sch-01',
      classGroupId: 'cls-1',
      className: '10-A',
    };

    it('identifies binary files and null bytes as binary text', () => {
      expect(isBinaryText('Hello \u0000 World')).toBe(true);
      expect(isBinaryText('PK\x03\x04SomeZipContent')).toBe(true);
      expect(isBinaryText('Abdullayeva Dilafro‘z\t1000003546584')).toBe(false);
    });

    it('strictly requires both FirstName and LastName and rejects garbage lines', () => {
      const junkRows = `
№\tFamiliya va Ism\tJinsi\tTug'ilgan sana
1\t-|- Ismsiz\tO'g'il\t2009-01-01
2\t| Ismsiz\tO'g'il\t2009-01-01
3\tSon\tO'g'il\t2009-01-01
4\tIsmsiz\tO'g'il\t2009-01-01
      `;
      const parsed = parseSmartTableText(junkRows, context);
      expect(parsed).toHaveLength(0);
    });

    it('parses real Uzbek names properly', () => {
      const validRows = `
№\tFamiliya va Ism\tJinsi\tTug'ilgan sana
1\tAbdullayeva Dilafro‘z\tF\t2009-04-12
2\tAlijonov Jasurbek Rustamovich\tM\t2008-11-20
      `;
      const parsed = parseSmartTableText(validRows, context);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]?.lastName).toBe('Abdullayeva');
      expect(parsed[0]?.firstName).toBe("Dilafro'z");
      expect(parsed[0]?.gender).toBe('F');
      expect(parsed[1]?.lastName).toBe('Alijonov');
      expect(parsed[1]?.firstName).toBe('Jasurbek');
      expect(parsed[1]?.middleName).toBe('Rustamovich');
      expect(parsed[1]?.gender).toBe('M');
    });
  });
});
