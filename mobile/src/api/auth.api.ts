import { apiClient } from './client';
import { UserDto, UpdateProfileInput } from '@unideliver/shared';

export interface AuthResponse {
  user: UserDto;
}

export const authApi = {
  /**
   * POST /api/v1/auth/session
   * Establishes a session from Firebase ID token and returns authenticated user
   */
  async session(idToken: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      skipAuth: true,
    });
  },

  /**
   * GET /api/v1/auth/me
   * Fetches current authenticated user profile
   */
  async getMe(): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/me', {
      method: 'GET',
    });
  },

  /**
   * PATCH /api/v1/users/me
   * Updates name/email (complete profile)
   */
  async updateMe(input: UpdateProfileInput): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  /**
   * POST /api/v1/users/me/push-token
   */
  async registerPushToken(token: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/users/me/push-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /**
   * DELETE /api/v1/users/me/push-token
   */
  async removePushToken(token: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/users/me/push-token', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  },
};
