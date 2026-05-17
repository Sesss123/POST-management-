const platformSettingsService = require('../services/platformSettingsService');

/**
 * Maintenance Mode Middleware
 * Blocks access to all non-super-admin users when maintenance mode is active.
 */
const maintenanceMiddleware = (req, res, next) => {
    const isMaintenance = platformSettingsService.getBool('maintenance_mode');

    // If not in maintenance mode, proceed
    if (!isMaintenance) {
        return next();
    }

    // Allow Super Admin routes always (so they can turn it off)
    if (req.path.startsWith('/api/super-admin') || req.path === '/api/auth/login') {
        return next();
    }

    // Allow Auth routes partially (but we'll check role after login)
    // Actually, it's better to let people login but block them if they aren't super admin
    
    // If user is already authenticated and is super_admin, let them through
    if (req.user && req.user.role === 'super_admin') {
        return next();
    }

    // For all other requests, return 503
    return res.status(503).json({
        success: false,
        maintenance: true,
        message: 'System is currently undergoing maintenance. Please try again later.',
        retryAfter: 3600 // 1 hour in seconds
    });
};

module.exports = maintenanceMiddleware;
