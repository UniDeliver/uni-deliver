import { Role, AccountStatus } from '../enums.js';

export interface UserAddress {
  id?: string;
  _id?: string;
  label: string;
  zoneId: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  instructions?: string;
  isDefault: boolean;
}

export interface RiderProfile {
  vehicleNo: string;
  isAvailable: boolean;
}

export interface UserDto {
  id: string;
  role: Role;
  status: AccountStatus;
  name: string;
  phone: string;
  email?: string | null;
  profileComplete: boolean;
  /** Primary campus drop-off point id (see DROP_OFF_POINTS). */
  dropOffPoint?: string | null;
  addresses?: UserAddress[];
  rider?: RiderProfile;
}

export interface AuthSessionResponse {
  data: {
    user: UserDto;
  };
}

/** Returned by register, login and reset-password. */
export interface AuthTokenResponse {
  user: UserDto;
  /** Backend-issued session JWT. Send as `Authorization: Bearer <token>`. */
  token: string;
  /** Token lifetime in seconds. */
  expiresIn: number;
}

export interface ForgotPasswordResponse {
  message: string;
  /** Only present outside production, so the flow can be tested without an SMS/email provider. */
  devCode?: string;
}

export interface ApiResponse<T> {
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
