import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { AppError } from '../../utils/errors';

export class UsersController {
  /**
   * PATCH /api/v1/users/me
   */
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthenticated();
      }

      const updated = await UsersService.updateMe(req.user, req.body);
      res.status(200).json({
        data: {
          user: updated,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/me/push-token
   */
  static async registerPushToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthenticated();
      }

      await UsersService.registerPushToken(req.user, req.body.token);
      res.status(200).json({
        data: {
          message: 'Push token registered successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/me/push-token
   */
  static async removePushToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthenticated();
      }

      const token = req.body?.token || (req.query?.token as string);
      if (token) {
        await UsersService.removePushToken(req.user, token);
      }
      res.status(200).json({
        data: {
          message: 'Push token removed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/riders
   */
  static async createRider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rider = await UsersService.createRider(req.body);
      res.status(201).json({
        data: {
          rider,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/users
   */
  static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, status } = req.query;
      const result = await UsersService.listUsers(role as string, status as string);
      res.status(200).json({
        data: result.users,
        meta: {
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:id/status
   */
  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = await UsersService.updateUserStatus(id, req.body);
      res.status(200).json({
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
