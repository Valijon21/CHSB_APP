import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';
import { router } from '../src/app/router';
import { createPinia } from 'pinia';

describe('App Shell', () => {
  it('mounts App root successfully with Pinia and Router', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.find('#chsb-app').exists()).toBe(true);
  });
});
