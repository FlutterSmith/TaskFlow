import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant.middleware';
import { errorResponse } from '../utils/response';
import { OrgRole } from '@prisma/client';

/**
 * Permission definitions for RBAC
 */
export const permissions = {
  // Organization permissions
  'organization:read': ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'],
  'organization:update': ['OWNER', 'ADMIN'],
  'organization:delete': ['OWNER'],
  'organization:billing': ['OWNER'],

  // Member permissions
  'member:invite': ['OWNER', 'ADMIN'],
  'member:remove': ['OWNER', 'ADMIN'],
  'member:update': ['OWNER', 'ADMIN'],

  // Project permissions
  'project:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'project:read': ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'],
  'project:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'project:delete': ['OWNER', 'ADMIN'],

  // Task permissions
  'task:create': ['OWNER', 'ADMIN', 'MEMBER'],
  'task:read': ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'],
  'task:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'task:delete': ['OWNER', 'ADMIN', 'MEMBER'],
  'task:assign': ['OWNER', 'ADMIN', 'MEMBER'],

  // Comment permissions
  'comment:create': ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'],
  'comment:update': ['OWNER', 'ADMIN', 'MEMBER'],
  'comment:delete': ['OWNER', 'ADMIN', 'MEMBER'],

  // Team permissions
  'team:create': ['OWNER', 'ADMIN'],
  'team:read': ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'],
  'team:update': ['OWNER', 'ADMIN'],
  'team:delete': ['OWNER', 'ADMIN'],
} as const;

export type Permission = keyof typeof permissions;

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.orgRole) {
      errorResponse(res, 'Organization role not found', 403, 'ROLE_MISSING');
      return;
    }

    const allowedRoles = permissions[permission];

    if (!allowedRoles.includes(req.orgRole as OrgRole)) {
      errorResponse(
        res,
        `Insufficient permissions. Required: ${permission}`,
        403,
        'PERMISSION_DENIED'
      );
      return;
    }

    next();
  };
};

/**
 * Check if user has specific role
 */
export const requireRole = (roles: OrgRole[]) => {
  return (req: TenantRequest, res: Response, next: NextFunction): void => {
    if (!req.orgRole) {
      errorResponse(res, 'Organization role not found', 403, 'ROLE_MISSING');
      return;
    }

    if (!roles.includes(req.orgRole as OrgRole)) {
      errorResponse(res, `Insufficient role. Required one of: ${roles.join(', ')}`, 403, 'ROLE_DENIED');
      return;
    }

    next();
  };
};

/**
 * Check if user is organization owner
 */
export const requireOwner = requireRole(['OWNER']);

/**
 * Check if user is admin or owner
 */
export const requireAdmin = requireRole(['OWNER', 'ADMIN']);
