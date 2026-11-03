import { ApiResponse, UserDto } from '@unideliver/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class AdminApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'AdminApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function adminApiClient<T>(
  endpoint: string,
  token?: string | null,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data: ApiResponse<T> = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorCode = data?.error?.code || 'UNKNOWN_ERROR';
    const errorMessage = data?.error?.message || `Request failed with status ${response.status}`;
    throw new AdminApiError(errorMessage, errorCode, response.status, data?.error?.details);
  }

  return (data as any)?.data !== undefined ? ((data as any).data as T) : (data as unknown as T);
}

export const adminAuthApi = {
  async getMe(token: string): Promise<{ user: UserDto }> {
    return adminApiClient<{ user: UserDto }>('/auth/me', token, { method: 'GET' });
  },

  async session(token: string): Promise<{ user: UserDto }> {
    return adminApiClient<{ user: UserDto }>('/auth/session', token, { method: 'POST' });
  },
};
