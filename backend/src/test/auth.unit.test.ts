import assert from 'assert';
import { AuthService } from '../modules/auth/auth.service';
import { UsersService } from '../modules/users/users.service';
import { Role, AccountStatus } from '@unideliver/shared';
import { UserModel } from '../models/user.model';

async function runTests() {
  console.log('🧪 Starting Auth & User Unit Tests...\n');

  // Test 1: Format user response with incomplete profile
  console.log('Test 1: Format user response (profileComplete = false when name is empty)');
  const mockCustomerIncomplete = {
    _id: { toString: () => 'user-123' },
    role: Role.CUSTOMER,
    status: AccountStatus.ACTIVE,
    name: '',
    phone: '+94771234567',
    email: undefined,
    addresses: [],
    rider: undefined,
  } as any;

  const formattedIncomplete = AuthService.formatUserResponse(mockCustomerIncomplete);
  assert.strictEqual(formattedIncomplete.id, 'user-123');
  assert.strictEqual(formattedIncomplete.role, Role.CUSTOMER);
  assert.strictEqual(formattedIncomplete.profileComplete, false);
  console.log('  ✅ profileComplete is false when name is empty');

  // Test 2: Format user response with complete profile
  console.log('\nTest 2: Format user response (profileComplete = true when name is set)');
  const mockCustomerComplete = {
    _id: { toString: () => 'user-123' },
    role: Role.CUSTOMER,
    status: AccountStatus.ACTIVE,
    name: 'Kasun Perera',
    phone: '+94771234567',
    email: 'kasun@example.com',
    addresses: [],
    rider: undefined,
  } as any;

  const formattedComplete = AuthService.formatUserResponse(mockCustomerComplete);
  assert.strictEqual(formattedComplete.name, 'Kasun Perera');
  assert.strictEqual(formattedComplete.profileComplete, true);
  console.log('  ✅ profileComplete is true when name is set');

  // Test 3: Rider pre-creation linking logic
  console.log('\nTest 3: Rider phone linking simulation');
  // Mock pre-created rider record
  let savedUser: any = null;
  const mockRiderRecord = {
    _id: { toString: () => 'rider-999' },
    firebaseUid: null,
    role: Role.RIDER,
    status: AccountStatus.ACTIVE,
    name: 'Sunil Rider',
    phone: '+94779998888',
    email: undefined,
    addresses: [],
    rider: { vehicleNo: 'WP-BIKE-1234', isAvailable: false },
    save: async function () {
      savedUser = this;
      return this;
    },
  };

  // Temporarily stub findOne on UserModel
  const originalFindOne = UserModel.findOne;
  try {
    (UserModel as any).findOne = async (query: any) => {
      if (query.firebaseUid === 'new-firebase-uid') {
        return null; // Not found by UID
      }
      if (query.phone === '+94779998888') {
        return mockRiderRecord; // Found pre-created rider
      }
      return null;
    };

    const linkedResult = await AuthService.handleSession({
      uid: 'new-firebase-uid',
      phone_number: '+94779998888',
      email: 'sunil@rider.lk',
    });

    assert.strictEqual(linkedResult.id, 'rider-999');
    assert.strictEqual(linkedResult.role, Role.RIDER);
    assert.strictEqual(mockRiderRecord.firebaseUid, 'new-firebase-uid');
    assert.strictEqual(mockRiderRecord.email, 'sunil@rider.lk');
    assert.strictEqual(linkedResult.profileComplete, true);
    console.log('  ✅ Pre-created rider linked successfully to new Firebase UID');
  } finally {
    UserModel.findOne = originalFindOne;
  }

  // Test 4: Profile update (UsersService.updateMe)
  console.log('\nTest 4: Profile update (completing name)');
  const userToUpdate = {
    _id: { toString: () => 'user-456' },
    role: Role.CUSTOMER,
    status: AccountStatus.ACTIVE,
    name: '',
    phone: '+94771112222',
    addresses: [],
    save: async function () { return this; },
  } as any;

  const updatedResult = await UsersService.updateMe(userToUpdate, {
    name: 'Nimal Silva',
    email: 'nimal@uni.ac.lk',
  });

  assert.strictEqual(updatedResult.name, 'Nimal Silva');
  assert.strictEqual(updatedResult.email, 'nimal@uni.ac.lk');
  assert.strictEqual(updatedResult.profileComplete, true);
  console.log('  ✅ Profile updated and completed');

  // Test 5: Push token registration and removal
  console.log('\nTest 5: Push token management');
  const userWithTokens = {
    pushTokens: ['token-A'],
    save: async function () { return this; },
  } as any;

  await UsersService.registerPushToken(userWithTokens, 'token-B');
  assert.deepStrictEqual(userWithTokens.pushTokens, ['token-A', 'token-B']);
  console.log('  ✅ Push token added');

  await UsersService.removePushToken(userWithTokens, 'token-A');
  assert.deepStrictEqual(userWithTokens.pushTokens, ['token-B']);
  console.log('  ✅ Push token removed');

  console.log('\n🎉 ALL AUTH TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
