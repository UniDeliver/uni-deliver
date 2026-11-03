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
  addresses?: UserAddress[];
  rider?: RiderProfile;
}

export interface AuthSessionResponse {
  data: {
    user: UserDto;
  };
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
