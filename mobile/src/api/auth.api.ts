import { apiClient } from './client';
import type {
  UserDto,
  UpdateProfileInput,
  AuthTokenResponse,
  ForgotPasswordResponse,
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@unideliver/shared';

const post = <T>(path: string, body: unknown, skipAuth = true) =>
  apiClient<T>(path, { method: 'POST', body: JSON.stringify(body), skipAuth });

export const authApi = {
  /** POST /auth/register: customer self-registration → session */
  register: (input: RegisterInput) => post<AuthTokenResponse>('/auth/register', input),

  /** POST /auth/login: email or phone + password → session */
  login: (input: LoginInput) => post<AuthTokenResponse>('/auth/login', input),

  /** POST /auth/password/forgot: sends a 6-digit reset code */
  forgotPassword: (input: ForgotPasswordInput) => post<ForgotPasswordResponse>('/auth/password/forgot', input),

  /** POST /auth/password/reset: code + new password → session */
  resetPassword: (input: ResetPasswordInput) => post<AuthTokenResponse>('/auth/password/reset', input),

  /** GET /auth/me: authoritative user + role, used for routing on app start */
  getMe: () => apiClient<{ user: UserDto }>('/auth/me', { method: 'GET' }),

  /** PATCH /users/me */
  updateMe: (input: UpdateProfileInput) =>
    apiClient<{ user: UserDto }>('/users/me', { method: 'PATCH', body: JSON.stringify(input) }),

  /** POST /users/me/push-token */
  registerPushToken: (token: string) => post<{ message: string }>('/users/me/push-token', { token }, false),

  /** DELETE /users/me/push-token */
  removePushToken: (token: string) =>
    apiClient<{ message: string }>('/users/me/push-token', { method: 'DELETE', body: JSON.stringify({ token }) }),
};
