import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../../models/user.model';
import {
  Role,
  AccountStatus,
  UserDto,
  AuthTokenResponse,
  ForgotPasswordResponse,
  RESET_CODE_LENGTH,
  isEmailIdentifier,
  normalizeSriLankanPhone,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@unideliver/shared';
import { z } from 'zod';
import { AppError } from '../../utils/errors';
import { DecodedFirebaseUser } from '../../middleware/authenticate';
import { env } from '../../config/env';
import { hashPassword, verifyPassword, generateNumericCode, hashCode, codesMatch } from '../../utils/password';

type RegisterData = z.output<typeof registerSchema>;
type LoginData = z.output<typeof loginSchema>;
type ForgotData = z.output<typeof forgotPasswordSchema>;
type ResetData = z.output<typeof resetPasswordSchema>;

export const JWT_ISSUER = 'unideliver-api';
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 1 day
const REMEMBER_ME_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const RESET_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_MAX_ATTEMPTS = 5;

// Used to keep login timing similar whether or not the account exists
const DUMMY_HASH =
  'scrypt$00000000000000000000000000000000$' + '0'.repeat(128);

export class AuthService {
  /** Signs a backend session JWT. `sub` is the Mongo user id. */
  static issueToken(user: IUser, rememberMe = false): { token: string; expiresIn: number } {
    const expiresIn = rememberMe ? REMEMBER_ME_TTL_SECONDS : SESSION_TTL_SECONDS;
    const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
      subject: user._id.toString(),
      issuer: JWT_ISSUER,
      expiresIn,
    });
    return { token, expiresIn };
  }

  /** Formats a MongoDB User document into the user contract (architecture.md 5.3). */
  static formatUserResponse(user: IUser): UserDto {
    const profileComplete = Boolean(user.name && user.name.trim().length > 0);

    return {
      id: user._id.toString(),
      role: user.role,
      status: user.status,
      name: user.name || '',
      phone: user.phone,
      email: user.email || null,
      profileComplete,
      dropOffPoint: user.dropOffPoint ?? null,
      addresses: user.addresses as any,
      rider: user.rider,
    };
  }

  private static authResponse(user: IUser, rememberMe = false): AuthTokenResponse {
    return { user: this.formatUserResponse(user), ...this.issueToken(user, rememberMe) };
  }

  /** Finds a user by email or Sri Lankan phone number. */
  private static findByIdentifier(identifier: string, extraSelect = '') {
    const query = isEmailIdentifier(identifier)
      ? { email: identifier.trim().toLowerCase() }
      : { phone: normalizeSriLankanPhone(identifier) };
    return UserModel.findOne(query).select(extraSelect);
  }

  /**
   * POST /auth/register: customer self-registration.
   * Riders are created by admins; admins are seeded.
   */
  static async register(input: RegisterData): Promise<AuthTokenResponse> {
    const [emailTaken, phoneTaken] = await Promise.all([
      UserModel.exists({ email: input.email }),
      UserModel.exists({ phone: input.phone }),
    ]);
    if (emailTaken) {
      throw AppError.conflict('EMAIL_ALREADY_EXISTS', 'An account with this email already exists. Try signing in.');
    }
    if (phoneTaken) {
      throw AppError.conflict(
        'PHONE_ALREADY_EXISTS',
        'An account with this phone number already exists. Sign in, or use "Forgot password" to set a password.'
      );
    }

    const user = await UserModel.create({
      firebaseUid: null,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      name: input.name,
      email: input.email,
      phone: input.phone,
      dropOffPoint: input.dropOffPoint,
      passwordHash: await hashPassword(input.password),
      addresses: [],
      pushTokens: [],
    });

    return this.authResponse(user);
  }

  /**
   * POST /auth/login: email or phone + password.
   * Suspended users still get a session so the app can show /account-suspended;
   * every protected route rejects them via authorize().
   */
  static async login(input: LoginData): Promise<AuthTokenResponse> {
    const user = await this.findByIdentifier(input.identifier, '+passwordHash');

    if (!user) {
      await verifyPassword(input.password, DUMMY_HASH);
      throw AppError.invalidCredentials();
    }

    if (!user.passwordHash) {
      // Pre-created riders (and Firebase-only accounts) have no password yet
      throw new AppError(
        'PASSWORD_NOT_SET',
        401,
        'No password has been set for this account yet. Use "Forgot password" to create one.'
      );
    }

    if (!(await verifyPassword(input.password, user.passwordHash))) {
      throw AppError.invalidCredentials();
    }

    return this.authResponse(user, input.rememberMe);
  }

  /**
   * POST /auth/password/forgot: sends a 6-digit reset code.
   * Always returns the same message so it cannot be used to discover accounts.
   */
  static async forgotPassword(input: ForgotData): Promise<ForgotPasswordResponse> {
    const response: ForgotPasswordResponse = {
      message: 'If an account matches, a verification code has been sent.',
    };

    const user = await this.findByIdentifier(input.identifier);
    if (!user || user.role === Role.ADMIN) {
      return response;
    }

    const code = generateNumericCode(RESET_CODE_LENGTH);
    user.passwordReset = {
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
      attempts: 0,
    };
    await user.save();

    // TODO: deliver via SMS (phone) or email provider. None is configured yet.
    if (env.NODE_ENV !== 'production') {
      console.log(`[AuthService] Password reset code for ${user._id}: ${code}`);
      response.devCode = code;
    } else {
      console.warn(`[AuthService] Password reset requested for ${user._id}, but no SMS/email provider is configured.`);
    }

    return response;
  }

  /** POST /auth/password/reset: verifies the code, sets the new password and signs in. */
  static async resetPassword(input: ResetData): Promise<AuthTokenResponse> {
    const user = await this.findByIdentifier(input.identifier, '+passwordReset');
    const reset = user?.passwordReset;

    if (!user || !reset || reset.expiresAt.getTime() < Date.now()) {
      throw AppError.badRequest('This code is invalid or has expired. Request a new one.');
    }

    if (reset.attempts >= RESET_MAX_ATTEMPTS) {
      user.passwordReset = null;
      await user.save();
      throw AppError.tooManyRequests('Too many incorrect codes. Request a new one.');
    }

    if (!codesMatch(input.code, reset.codeHash)) {
      reset.attempts += 1;
      user.markModified('passwordReset');
      await user.save();
      throw AppError.badRequest('Incorrect verification code.');
    }

    user.passwordHash = await hashPassword(input.newPassword);
    user.passwordReset = null;
    await user.save();

    return this.authResponse(user);
  }

  /**
   * POST /auth/session (Firebase ID token). Used by the admin portal and future Google sign-in.
   * Finds by firebaseUid, links a pre-created rider by phone, or creates a customer.
   */
  static async handleSession(firebaseUser: DecodedFirebaseUser): Promise<UserDto> {
    const { uid, phone_number, email, name } = firebaseUser;

    let user = await UserModel.findOne({ firebaseUid: uid });

    if (user) {
      let modified = false;
      if (!user.email && email) {
        user.email = email;
        modified = true;
      }
      if (!user.name && name) {
        user.name = name;
        modified = true;
      }
      if (modified) await user.save();
      return this.formatUserResponse(user);
    }

    if (phone_number) {
      user = await UserModel.findOne({ phone: phone_number });
      if (user) {
        user.firebaseUid = uid;
        if (!user.email && email) user.email = email;
        await user.save();
        return this.formatUserResponse(user);
      }
    }

    const newCustomer = await UserModel.create({
      firebaseUid: uid,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      name: name || '',
      phone: phone_number || `+9477${Date.now().toString().slice(-7)}`,
      email: email || undefined,
      addresses: [],
      pushTokens: [],
    });

    return this.formatUserResponse(newCustomer);
  }
}
