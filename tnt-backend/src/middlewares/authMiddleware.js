import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tnt_luxury_streetwear_secret_key_2024');

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { 
        role: {
          include: { permissions: true }
        }, 
        addresses: true, 
        wishlist: { include: { items: true } } 
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

export const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (req.user?.role?.name === 'SUPER_ADMIN') {
      return next();
    }
    const permissions = req.user?.role?.permissions || [];
    const hasPerm = permissions.some(p => p.name === permissionName);
    if (!hasPerm) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

export const requireAnyPermission = (...permissionNames) => {
  return (req, res, next) => {
    if (req.user?.role?.name === 'SUPER_ADMIN') {
      return next();
    }
    const permissions = req.user?.role?.permissions || [];
    const hasAny = permissionNames.some(name => permissions.some(p => p.name === name));
    if (!hasAny) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

export const checkMaintenanceMode = async (req, res, next) => {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: 'default-settings' }
    });

    if (settings && settings.maintenanceMode) {
      // Allow authenticated staff to bypass maintenance mode
      const isStaff = req.user && req.user.role && req.user.role.name !== 'CUSTOMER';
      if (!isStaff) {
        return res.status(503).json({
          success: false,
          message: settings.maintenanceMessage || "The store is currently in maintenance mode. Please try again later."
        });
      }
    }
    next();
  } catch (error) {
    next();
  }
};
