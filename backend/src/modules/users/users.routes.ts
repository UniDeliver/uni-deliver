import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { Role } from '@unideliver/shared';
import {
  updateProfileSchema,
  registerPushTokenSchema,
  createRiderSchema,
  updateUserStatusSchema,
} from '@unideliver/shared';

export const usersRoutes = Router();
export const adminUsersRoutes = Router();

// /api/v1/users/me routes (customer, rider)
usersRoutes.patch(
  '/me',
  authenticate,
  authorize(Role.CUSTOMER, Role.RIDER, Role.ADMIN),
  validateBody(updateProfileSchema),
  UsersController.updateMe
);

usersRoutes.post(
  '/me/push-token',
  authenticate,
  authorize(Role.CUSTOMER, Role.RIDER),
  validateBody(registerPushTokenSchema),
  UsersController.registerPushToken
);

usersRoutes.delete(
  '/me/push-token',
  authenticate,
  authorize(Role.CUSTOMER, Role.RIDER),
  UsersController.removePushToken
);

// /api/v1/admin/users and /api/v1/admin/riders routes (admin only)
adminUsersRoutes.get(
  '/users',
  authenticate,
  authorize(Role.ADMIN),
  UsersController.listUsers
);

adminUsersRoutes.post(
  '/riders',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(createRiderSchema),
  UsersController.createRider
);

adminUsersRoutes.patch(
  '/users/:id/status',
  authenticate,
  authorize(Role.ADMIN),
  validateBody(updateUserStatusSchema),
  UsersController.updateUserStatus
);
