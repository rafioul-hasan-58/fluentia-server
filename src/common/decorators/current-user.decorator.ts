import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedUser {
  id: string;
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Placeholder / CurrentUser decorator.
 * Extracts the user or user property from the request object,
 * falling back to a default placeholder MongoDB ObjectId string if auth guards are not yet wired.
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    // Use authenticated user if present, or fallback placeholder for development/testing
    const user: AuthenticatedUser = request.user || {
      id: '665f1b2e1111111111111111',
    };

    if (data) {
      return user[data];
    }
    return user;
  },
);
