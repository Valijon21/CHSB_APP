import { describe, it, expect, beforeEach, vi } from 'vitest';
import { httpClient } from '../src/shared/api/httpClient';

const SESSION_KEY = 'chsb_auth_session';

function respond(status: number, body: unknown = {}) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status < 400,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response);
}

function sentHeaders(spy: ReturnType<typeof respond>): Record<string, string> {
  return spy.mock.calls[0]![1]!.headers as Record<string, string>;
}

describe('httpClient authentication', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    httpClient.setUnauthorizedHandler(null);
  });

  it('sends the token of a session without "remember me"', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'tab-token' }));
    const spy = respond(200);

    await httpClient.get('/classes');

    expect(sentHeaders(spy).Authorization).toBe('Bearer tab-token');
  });

  it('sends the token of a remembered session', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'kept-token' }));
    const spy = respond(200);

    await httpClient.get('/classes');

    expect(sentHeaders(spy).Authorization).toBe('Bearer kept-token');
  });

  it('uploads files with the token and lets the browser set the content type', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'tab-token' }));
    const spy = respond(200);

    await httpClient.postForm('/students/parse-file', new FormData());

    expect(sentHeaders(spy).Authorization).toBe('Bearer tab-token');
    expect(sentHeaders(spy)['Content-Type']).toBeUndefined();
  });

  it('reports a rejected token', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'expired' }));
    respond(401, { detail: 'expired' });
    const handler = vi.fn();
    httpClient.setUnauthorizedHandler(handler);

    await expect(httpClient.get('/classes')).rejects.toThrow('expired');

    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not report a 401 for anonymous requests or failed sign-ins', async () => {
    respond(401, { detail: 'no' });
    const handler = vi.fn();
    httpClient.setUnauthorizedHandler(handler);

    await expect(httpClient.get('/classes')).rejects.toThrow();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'old' }));
    await expect(httpClient.post('/auth/login', {})).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });
});
