import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { UserModel } from '../models/user.model';
import { Role, AccountStatus } from '@unideliver/shared';
import { firebaseAuth, hasLiveFirebaseCredentials } from '../config/firebase';

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@unideliver.lk';
  const adminPhone = process.env.ADMIN_PHONE || '+94770000001';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

  console.log('--- UniDeliver Admin Seeder ---');
  console.log(`Target Email: ${adminEmail}`);
  console.log(`Target Phone: ${adminPhone}`);

  await connectDatabase();

  let firebaseUid = 'admin-dev-uid';

  if (hasLiveFirebaseCredentials) {
    try {
      let fbUser;
      try {
        fbUser = await firebaseAuth.getUserByEmail(adminEmail);
        console.log(`[Firebase] Existing Firebase user found with email ${adminEmail}: UID ${fbUser.uid}`);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          fbUser = await firebaseAuth.createUser({
            email: adminEmail,
            password: adminPassword,
            displayName: adminName,
            phoneNumber: adminPhone,
            emailVerified: true,
          });
          console.log(`[Firebase] Created new Firebase user: UID ${fbUser.uid}`);
        } else {
          throw e;
        }
      }
      firebaseUid = fbUser.uid;
    } catch (err: any) {
      console.warn(`[Firebase] Could not sync with Firebase Auth: ${err.message}`);
    }
  } else {
    console.log('[Firebase] Running in local/dev mode: Using simulated UID for admin');
  }

  // Upsert admin in MongoDB
  let adminUser = await UserModel.findOne({
    $or: [{ email: adminEmail }, { phone: adminPhone }, { firebaseUid }],
  });

  if (adminUser) {
    adminUser.role = Role.ADMIN;
    adminUser.status = AccountStatus.ACTIVE;
    adminUser.name = adminName;
    adminUser.email = adminEmail;
    adminUser.phone = adminPhone;
    adminUser.firebaseUid = firebaseUid;
    await adminUser.save();
    console.log(`[Database] Updated existing admin user: ID ${adminUser._id}`);
  } else {
    adminUser = new UserModel({
      firebaseUid,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      addresses: [],
      pushTokens: [],
    });
    await adminUser.save();
    console.log(`[Database] Created new admin user: ID ${adminUser._id}`);
  }

  console.log('Admin seeded successfully:');
  console.log({
    id: adminUser._id,
    name: adminUser.name,
    email: adminUser.email,
    phone: adminUser.phone,
    role: adminUser.role,
    status: adminUser.status,
    firebaseUid: adminUser.firebaseUid,
  });

  await disconnectDatabase();
}

seedAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Admin seeding failed:', err);
    process.exit(1);
  });
