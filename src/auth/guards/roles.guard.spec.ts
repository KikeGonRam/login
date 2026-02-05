import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const createContext = (user: any, roles: string[] | undefined) => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  const context: any = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  };

  return { guard, context };
};

describe('RolesGuard', () => {
  it('permite acceso si no hay roles requeridos', () => {
    const { guard, context } = createContext({ roles: ['SYSTEM_ADMIN'] }, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('deniega si no hay user', () => {
    const { guard, context } = createContext(undefined, ['SYSTEM_ADMIN']);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('deniega si no tiene rol requerido', () => {
    const { guard, context } = createContext({ roles: ['SUPPORT_AGENT'] }, ['SYSTEM_ADMIN']);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('permite si tiene rol requerido', () => {
    const { guard, context } = createContext({ roles: ['SYSTEM_ADMIN'] }, ['SYSTEM_ADMIN']);
    expect(guard.canActivate(context)).toBe(true);
  });
});
