import { UserModel, IUser } from '../../models/user.model';
import { Role, AccountStatus, UserDto } from '@unideliver/shared';
import { AppError } from '../../utils/errors';
import { DecodedFirebaseUser } from '../../middleware/authenticate';

export class AuthService {
  /**
   * Formats a MongoDB User document into the user contract specified by architecture.md
   */
  static formatUserResponse(user: IUser): UserDto {
    const hasName = Boolean(user.name && user.name.trim().length > 0);
    // Profile is complete if user has a non-empty name
    const profileComplete = hasName;

    return {
      id: user._id.toString(),
      role: user.role,
      status: user.status,
      name: user.name || '',
      phone: user.phone,
      email: user.email || null,
      profileComplete,
      addresses: user.addresses as any,
      rider: user.rider,
    };
  }

  /**
   * Handles POST /auth/session
   * Authenticates or creates the MongoDB user record linked to the Firebase UID
   */
  static async handleSession(firebaseUser: DecodedFirebaseUser): Promise<UserDto> {
    const { uid, phone_number, email, name } = firebaseUser;

    // 1. Try to find user by firebaseUid
    let user = await UserModel.findOne({ firebaseUid: uid });

    if (user) {
      // If user exists, update email/name if missing
      let modified = false;
      if (!user.email && email) {
        user.email = email;
        modified = true;
      }
      if (!user.name && name) {
        user.name = name;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
      return this.formatUserResponse(user);
    }

    // 2. If not found by firebaseUid, check if pre-created by phone (e.g. Rider created by Admin)
    if (phone_number) {
      user = await UserModel.findOne({ phone: phone_number });

      if (user) {
        // Link the Firebase UID to the pre-created user record
        user.firebaseUid = uid;
        if (!user.email && email) {
          user.email = email;
        }
        await user.save();
        console.log(`[AuthService] Linked pre-created user (${user.role}: ${user.phone}) to Firebase UID: ${uid}`);
        return this.formatUserResponse(user);
      }
    }

    // 3. New Customer Self-Registration
    // As per architecture.md: customers self-register; riders cannot self-register
    const fallbackPhone = phone_number || `pending-${uid.substring(0, 8)}`;

    const newCustomer = new UserModel({
      firebaseUid: uid,
      role: Role.CUSTOMER,
      status: AccountStatus.ACTIVE,
      name: name || '',
      phone: fallbackPhone,
      email: email || undefined,
      addresses: [],
      pushTokens: [],
    });

    await newCustomer.save();
    console.log(`[AuthService] Created new customer record for UID: ${uid}, phone: ${fallbackPhone}`);

    return this.formatUserResponse(newCustomer);
  }

  /**
   * Handles GET /auth/me
   */
  static async getCurrentUser(firebaseUser: DecodedFirebaseUser): Promise<UserDto> {
    const user = await UserModel.findOne({ firebaseUid: firebaseUser.uid });

    if (!user) {
      throw AppError.notFound('User profile not found. Please establish a session first.');
    }

    return this.formatUserResponse(user);
  }
}
