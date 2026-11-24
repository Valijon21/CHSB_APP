import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TablePagination from '../src/shared/components/TablePagination.vue';

describe('TablePagination Component', () => {
  it('renders summary text and page size selector with 10, 20, 30, 50 options', () => {
    const wrapper = mount(TablePagination, {
      props: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 35,
      },
    });

    expect(wrapper.text()).toContain('Ko\'rsatilmoqda:');
    expect(wrapper.text()).toContain('1-10');
    expect(wrapper.text()).toContain('35 ta');

    // Page size buttons exist
    expect(wrapper.find('[data-testid="page-size-10"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="page-size-20"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="page-size-30"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="page-size-50"]').exists()).toBe(true);
  });

  it('emits update:pageSize and resets currentPage to 1 when size is changed', async () => {
    const wrapper = mount(TablePagination, {
      props: {
        currentPage: 3,
        pageSize: 10,
        totalItems: 100,
      },
    });

    const btn20 = wrapper.find('[data-testid="page-size-20"]');
    await btn20.trigger('click');

    expect(wrapper.emitted('update:pageSize')).toBeTruthy();
    expect(wrapper.emitted('update:pageSize')?.[0]).toEqual([20]);

    expect(wrapper.emitted('update:currentPage')).toBeTruthy();
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([1]);
  });

  it('navigates to next and previous pages when buttons are clicked', async () => {
    const wrapper = mount(TablePagination, {
      props: {
        currentPage: 2,
        pageSize: 10,
        totalItems: 50,
      },
    });

    const prevBtn = wrapper.find('[data-testid="prev-page-btn"]');
    const nextBtn = wrapper.find('[data-testid="next-page-btn"]');

    expect(prevBtn.attributes('disabled')).toBeUndefined();
    expect(nextBtn.attributes('disabled')).toBeUndefined();

    // Click next
    await nextBtn.trigger('click');
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([3]);

    // Click prev
    await prevBtn.trigger('click');
    expect(wrapper.emitted('update:currentPage')?.[1]).toEqual([1]);
  });

  it('disables previous button on first page and next button on last page', () => {
    const firstPageWrapper = mount(TablePagination, {
      props: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 30,
      },
    });
    expect(firstPageWrapper.find('[data-testid="prev-page-btn"]').attributes('disabled')).toBeDefined();

    const lastPageWrapper = mount(TablePagination, {
      props: {
        currentPage: 3,
        pageSize: 10,
        totalItems: 30,
      },
    });
    expect(lastPageWrapper.find('[data-testid="next-page-btn"]').attributes('disabled')).toBeDefined();
  });

  it('navigates directly when a page number button is clicked', async () => {
    const wrapper = mount(TablePagination, {
      props: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 40,
      },
    });

    const page3Btn = wrapper.find('[data-testid="page-btn-3"]');
    expect(page3Btn.exists()).toBe(true);

    await page3Btn.trigger('click');
    expect(wrapper.emitted('update:currentPage')?.[0]).toEqual([3]);
  });

  it('handles zero items gracefully without crashing', () => {
    const wrapper = mount(TablePagination, {
      props: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
      },
    });

    expect(wrapper.text()).toContain('0-0');
    expect(wrapper.text()).toContain('0 ta');
  });
});
