import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method?.toUpperCase() ?? 'GET';
    const url = request.originalUrl ?? request.url ?? '';

    if (!this.shouldAudit(request, method, url)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const userId = request.user?.sub ?? null;
        const ipAddress = request.ip;
        const description = `${method} ${url}`;
        void this.auditService
          .log(userId, 'SYSTEM_ACCESS', description, ipAddress)
          .catch(() => undefined);
      }),
    );
  }

  private shouldAudit(request: Request, method: string, url: string): boolean {
    if (!request.user?.sub) {
      return false;
    }

    if (url.startsWith('/auth') || url.startsWith('/audit')) {
      return false;
    }

    return method !== 'GET';
  }
}