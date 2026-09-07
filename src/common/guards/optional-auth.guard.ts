import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './auth.guard';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return true;
    }

    const [type, token] = authHeader.split(/\s+/);
    if (type?.toLowerCase() === 'bearer' && token) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
        request['user'] = payload;
      } catch {
        // Token is invalid/expired; continue as unauthenticated guest without error
      }
    }

    return true;
  }
}
