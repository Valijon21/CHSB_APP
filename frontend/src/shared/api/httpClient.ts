import { logger } from '../services/logger/LoggerService';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class HttpClient {
  private baseUrl: string;

  constructor() {
    // In Vite, import.meta.env is statically replaced at build time
    if (import.meta.env.VITE_API_BASE_URL) {
      this.baseUrl = import.meta.env.VITE_API_BASE_URL;
    } else if (import.meta.env.DEV) {
      this.baseUrl = 'http://localhost:8000/api/v1';
    } else {
      // In production (All-in-One Docker / Same Origin), use relative /api/v1
      this.baseUrl = '/api/v1';
    }
  }

  private getToken(): string | null {
    try {
      const sessionStr = localStorage.getItem('chsb_auth_session');
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        return parsed?.token || parsed?.user?.token || null;
      }
    } catch {
      // Ignore localStorage parse errors
    }
    return null;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeoutMs = 15000, headers = {}, ...rest } = options;
    const url = this.buildUrl(path, params);

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token && !reqHeaders.Authorization) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
      ...rest,
      headers: reqHeaders,
    };

    // Safely apply timeout only in real browser environments without cross-realm jsdom collisions
    const isRealBrowser = typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http');
    if (isRealBrowser && typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal && timeoutMs > 0) {
      try {
        fetchOptions.signal = AbortSignal.timeout(timeoutMs);
      } catch {
        // Skip signal on cross-realm polyfills
      }
    }

    try {
      const response = await fetch(url, fetchOptions);

      let responseData: unknown = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const dataRecord = typeof responseData === 'object' && responseData !== null ? (responseData as Record<string, unknown>) : null;
        const errorMsg =
          (dataRecord?.detail as string) ||
          (dataRecord?.message as string) ||
          `HTTP ${response.status}: Server so'rovni bajara olmadi.`;
        logger.error(`API Error [${response.status}] ${path}:`, { errorMsg, responseData });
        throw new ApiError(errorMsg, response.status, responseData);
      }

      return responseData as T;
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        const timeoutMsg = "Tarmoq so'rovi vaqti tugadi (Timeout). Qaytadan urinib ko'ring.";
        logger.error(`API Timeout: ${path}`, { timeoutMs });
        throw new ApiError(timeoutMsg, 408);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`API Network Failure: ${path}`, { error: err?.message });
      throw new ApiError(err?.message || "Tarmoqda xatolik yuz berdi.", 500);
    }
  }

  get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
