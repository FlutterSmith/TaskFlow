import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../database/prisma';
import { errorResponse } from '../utils/response';

export interface TenantRequest extends AuthRequest {
  organizationId?: string;
  orgRole?: string;
}

/**
 * Middleware to extract and validate organization context
 * Requires authentication middleware to run first
 */
export const tenantContext = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    // Get organization ID from params, query, or body
    const orgId =
      req.params.organizationId || req.query.organizationId || req.body.organizationId;

    if (!orgId) {
      errorResponse(res, 'Organization ID required', 400, 'ORG_ID_REQUIRED');
      return;
    }

    // Verify user belongs to organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId as string,
          userId: req.user.userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      errorResponse(res, 'Access denied to this organization', 403, 'ORG_ACCESS_DENIED');
      return;
    }

    // Check if org subscription is active
    if (membership.organization.subscriptionStatus !== 'ACTIVE') {
      errorResponse(res, 'Organization subscription is not active', 403, 'ORG_INACTIVE');
      return;
    }

    // Set organization context on request
    req.organizationId = orgId as string;
    req.orgRole = membership.role;

    next();
  } catch (error) {
    errorResponse(res, 'Failed to validate organization context', 500, 'TENANT_ERROR');
    return;
  }
};

/**
 * Middleware to enforce tenant isolation on Prisma queries
 * Automatically filters queries by organization ID
 */
export const applyTenantFilter = (orgId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          // Add organizationId filter if model has it
          if ('organizationId' in args.where || true) {
            args.where = { ...args.where, organizationId: orgId };
          }
          return query(args);
        },
      },
    },
  });
};
