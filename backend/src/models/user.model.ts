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

export interface IUser extends Document {
  firebaseUid: string | null;
  role: Role;
  status: AccountStatus;
  name: string;
  phone: string;
  email?: string;
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
      sparse: true,
      index: true,
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
      sparse: true,
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
// { firebaseUid: 1 } unique sparse, { phone: 1 } unique, { role: 1, status: 1 }
UserSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1, status: 1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
