import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result: unknown) => {
        const isObject = result !== null && typeof result === 'object';
        const resObj = isObject ? (result as Record<string, unknown>) : null;

        const message =
          typeof resObj?.message === 'string'
            ? resObj.message
            : 'Request Successfull';

        const data = (resObj && 'data' in resObj ? resObj.data : result) as T;

        return {
          success: true,
          message,
          data,
        };
      }),
    );
  }
}
