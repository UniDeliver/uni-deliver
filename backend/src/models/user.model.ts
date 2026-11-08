import mongoose, { Document, Schema } from 'mongoose';
import { Role, AccountStatus } from '@unideliver/shared';

export interface IUserAddress {
  _id?: mongoose.Types.ObjectId;
  label: string;
  zoneId: mongoose.Types.ObjectId;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  instructions?: string;
  isDefault: boolean;
}

export interface IRiderDetails {
  vehicleNo: string;
  isAvailable: boolean;
}

export interface IPasswordReset {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
}

export interface IUser extends Document {
  firebaseUid: string | null;
  role: Role;
  status: AccountStatus;
  name: string;
  phone: string;
  email?: string;
  /** scrypt hash. Never selected by default; use `.select('+passwordHash')`. */
  passwordHash?: string | null;
  /** Pending password-reset code. Never selected by default. */
  passwordReset?: IPasswordReset | null;
  /** Primary campus drop-off point id (DROP_OFF_POINTS in @unideliver/shared). */
  dropOffPoint?: string | null;
  addresses: IUserAddress[];
  rider?: IRiderDetails;
  pushTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IUserAddress>(
  {
    label: { type: String, required: true, trim: true },
    zoneId: { type: Schema.Types.ObjectId, ref: 'DeliveryZone', required: false },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    instructions: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const RiderDetailsSchema = new Schema<IRiderDetails>(
  {
    vehicleNo: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.CUSTOMER,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
      required: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordReset: {
      type: new Schema<IPasswordReset>(
        {
          codeHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          attempts: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: null,
      select: false,
    },
    dropOffPoint: {
      type: String,
      default: null,
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    rider: {
      type: RiderDetailsSchema,
      required: false,
    },
    pushTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes matching architecture.md:
// { firebaseUid: 1 } unique partial, { phone: 1 } unique, { email: 1 } unique partial, { role: 1, status: 1 }
// Partial (not sparse): password-only users store firebaseUid: null, and sparse indexes still index nulls
UserSchema.index({ firebaseUid: 1 }, { unique: true, partialFilterExpression: { firebaseUid: { $type: 'string' } } });
UserSchema.index({ role: 1, status: 1 });
// Email is optional but is a login identifier, so it must be unique when present
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
