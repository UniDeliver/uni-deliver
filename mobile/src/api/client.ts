import { ApiResponse } from '@unideliver/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let tokenGetter: (() => Promise<string | null>) | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setAuthTokenProvider(provider: () => Promise<string | null>) {
  tokenGetter = provider;
}

export function setOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth && tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data: ApiResponse<T> = isJson ? await response.json() : null;

  if (!response.ok) {
    // Only an authenticated request means "session expired"; a 401 from /auth/login is just a wrong password
    if (response.status === 401 && !options.skipAuth && onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }

    const errorCode = data?.error?.code || 'UNKNOWN_ERROR';
    const errorMessage = data?.error?.message || `Request failed with status ${response.status}`;
    const errorDetails = data?.error?.details;

    throw new ApiError(errorMessage, errorCode, response.status, errorDetails);
  }

  return (data as any)?.data !== undefined ? ((data as any).data as T) : (data as unknown as T);
}
