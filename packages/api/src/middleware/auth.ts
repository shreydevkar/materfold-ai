import type { NextFunction, Request, Response } from 'express';

export interface AuthUser {
  id: string;
  clientIds: string[];
  organizationId: string;
  role: 'admin' | 'manager' | 'creator' | 'viewer';
}

export interface AuthRequest extends Request {
  user: AuthUser;
  org: { id: string };
  clientScope?: { clientId: string; organizationId: string };
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  (req as AuthRequest).user = {
    id: 'demo-user',
    clientIds: ['demo-client'],
    organizationId: 'demo-org',
    role: 'admin',
  };
  (req as AuthRequest).org = { id: 'demo-org' };
  next();
}

export function validateUserAccess(user: AuthUser, clientId: string): void {
  if (!user.clientIds.includes(clientId)) {
    throw new Error('Access denied');
  }
}

export function validateClientAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  const clientId = req.params.clientId || String(req.body.clientId ?? '');

  if (!req.user.clientIds.includes(clientId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  req.clientScope = {
    clientId,
    organizationId: req.org.id,
  };

  next();
}

export function withClientScope(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  const clientId = req.params.clientId || String((req.body as { clientId?: string }).clientId ?? (req.query.clientId as string | undefined) ?? '');

  if (!clientId) {
    res.status(400).json({ error: 'clientId is required' });
    return;
  }

  if (!authReq.user.clientIds.includes(clientId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  authReq.clientScope = {
    clientId,
    organizationId: authReq.org.id,
  };

  next();
}