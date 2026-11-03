import { UserModel, IUser } from '../../models/user.model';
import { Role, AccountStatus, UserDto, UpdateProfileInput, CreateRiderInput, UpdateUserStatusInput } from '@unideliver/shared';
import { AppError } from '../../utils/errors';
import { AuthService } from '../auth/auth.service';

export class UsersService {
  /**
   * Update profile (name, email) for current user
   */
  static async updateMe(user: IUser, input: UpdateProfileInput): Promise<UserDto> {
    if (input.name !== undefined) {
      user.name = input.name.trim();
    }
    if (input.email !== undefined) {
      user.email = input.email ? input.email.trim() : undefined;
    }

    await user.save();
    return AuthService.formatUserResponse(user);
  }

  /**
   * Register push notification token
   */
  static async registerPushToken(user: IUser, token: string): Promise<void> {
    if (!user.pushTokens.includes(token)) {
      user.pushTokens.push(token);
      await user.save();
    }
  }

  /**
   * Remove push notification token (called on logout)
   */
  static async removePushToken(user: IUser, token: string): Promise<void> {
    user.pushTokens = user.pushTokens.filter(t => t !== token);
    await user.save();
  }

  /**
   * Admin: Pre-create rider (SR03, Section 5.2)
   * Riders cannot self-register. Admin creates rider with phone, name, vehicleNo.
   */
  static async createRider(input: CreateRiderInput): Promise<UserDto> {
    const existing = await UserModel.findOne({ phone: input.phone });
    if (existing) {
      throw AppError.conflict('PHONE_ALREADY_EXISTS', 'A user with this phone number already exists.');
    }

    const rider = new UserModel({
      firebaseUid: null, // linked when rider first signs in with this phone
      role: Role.RIDER,
      status: AccountStatus.ACTIVE,
      name: input.name,
      phone: input.phone,
      rider: {
        vehicleNo: input.vehicleNo,
        isAvailable: false,
      },
      pushTokens: [],
    });

    await rider.save();
    return AuthService.formatUserResponse(rider);
  }

  /**
   * Admin: List users with optional filtering
   */
  static async listUsers(role?: string, status?: string): Promise<{ users: UserDto[]; total: number }> {
    const query: Record<string, any> = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await UserModel.find(query).sort({ createdAt: -1 });
    return {
      users: users.map(u => AuthService.formatUserResponse(u)),
      total: users.length,
    };
  }

  /**
   * Admin: Activate or suspend user
   */
  static async updateUserStatus(userId: string, input: UpdateUserStatusInput): Promise<UserDto> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    user.status = input.status;
    await user.save();

    return AuthService.formatUserResponse(user);
  }
}
