import 'express';

declare module 'express' {
  export interface Request {
    user?: {
      sub: string;
      email: string;
      roles: string[];
      systems: string[];
      sessionId?: string;
    };
  }
}
