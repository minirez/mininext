import { ForbiddenError } from '../core/errors.js'

/**
 * @module middleware/permission
 * @description Permission middleware for checking user access rights.
 * All errors are passed to the error handler middleware via next(error).
 */

/**
 * Require specific permission for a module/action
 * @param {string} module - Module name (dashboard, planning, booking, etc.)
 * @param {string} action - Action type (view, create, edit, delete)
 * @returns {import('express').RequestHandler} Express middleware
 */
export const requirePermission = (module, action) => {
  return (req, res, next) => {
    const user = req.user

    if (!user) {
      return next(new ForbiddenError('UNAUTHORIZED'))
    }

    // Admins have all permissions
    if (user.role === 'admin') {
      return next()
    }

    // Check user's permission using model method
    if (user.hasPermission && user.hasPermission(module, action)) {
      return next()
    }

    // Check raw permissions array (for when user object doesn't have method)
    if (user.permissions) {
      const permission = user.permissions.find(p => p.module === module)
      if (permission && permission.actions?.[action] === true) {
        return next()
      }
    }

    return next(new ForbiddenError('PERMISSION_DENIED'))
  }
}

/**
 * Require any of the specified permissions (OR logic)
 * @param {Array<{module: string, action: string}>} permissions - Array of permission requirements
 * @returns {import('express').RequestHandler} Express middleware
 */
export const requireAnyPermission = permissions => {
  return (req, res, next) => {
    const user = req.user

    if (!user) {
      return next(new ForbiddenError('UNAUTHORIZED'))
    }

    // Admins have all permissions
    if (user.role === 'admin') {
      return next()
    }

    // Check if user has any of the required permissions
    const hasAny = permissions.some(({ module, action }) => {
      if (user.hasPermission) {
        return user.hasPermission(module, action)
      }
      const permission = user.permissions?.find(p => p.module === module)
      return permission && permission.actions?.[action] === true
    })

    if (hasAny) {
      return next()
    }

    return next(new ForbiddenError('PERMISSION_DENIED'))
  }
}

/**
 * Require all of the specified permissions (AND logic)
 * @param {Array<{module: string, action: string}>} permissions - Array of permission requirements
 * @returns {import('express').RequestHandler} Express middleware
 */
export const requireAllPermissions = permissions => {
  return (req, res, next) => {
    const user = req.user

    if (!user) {
      return next(new ForbiddenError('UNAUTHORIZED'))
    }

    // Admins have all permissions
    if (user.role === 'admin') {
      return next()
    }

    // Check if user has all required permissions
    const hasAll = permissions.every(({ module, action }) => {
      if (user.hasPermission) {
        return user.hasPermission(module, action)
      }
      const permission = user.permissions?.find(p => p.module === module)
      return permission && permission.actions?.[action] === true
    })

    if (hasAll) {
      return next()
    }

    return next(new ForbiddenError('PERMISSION_DENIED'))
  }
}

/**
 * Require admin role
 * @type {import('express').RequestHandler}
 */
export const requireAdmin = (req, res, next) => {
  const user = req.user

  if (!user) {
    return next(new ForbiddenError('UNAUTHORIZED'))
  }

  if (user.role !== 'admin') {
    return next(new ForbiddenError('ADMIN_REQUIRED'))
  }

  return next()
}

export default {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin
}
