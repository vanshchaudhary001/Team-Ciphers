import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'startsmart-super-secret-key-2026';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  employeeProfileId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      employeeProfileId: user.employeeProfileId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Verify user still exists in database and load profile
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { employeeProfile: true },
    });

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        error: 'User not found or session expired',
      });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      companyId: dbUser.companyId,
      employeeProfileId: dbUser.employeeProfile?.id,
    };

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Enforce role-based access control
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      });
    }

    next();
  };
}

/**
 * Tenant scoping middleware: ensures the requested company matches authenticated user's company
 */
export function enforceTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const requestedCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

  // If a companyId was explicitly supplied in request, verify it matches the user's company
  if (requestedCompanyId && requestedCompanyId !== req.user.companyId && req.user.role !== 'PLATFORM_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Cross-tenant access prohibited. You cannot access resources outside your organization.',
    });
  }

  next();
}
