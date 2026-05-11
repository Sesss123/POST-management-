const rateLimit = require('express-rate-limit');
const { logAudit } = require('../utils/auditLogger');
const securitySettingsService = require('../services/securitySettingsService');

/**
 * Rate Limiter for Login attempts
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req, res) => securitySettingsService.get('security_auth_limit') || 10,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
    handler: async (req, res, next, options) => {
        // Audit log for repeated suspicious attempts
        try {
            await logAudit(null, {
                userId: null,
                action: 'rate_limit_login',
                entityType: 'security',
                newValue: { 
                    email: req.body ? req.body.email : 'unknown', 
                    ip: req.ip,
                    reason: 'Brute force protection triggered'
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        } catch (err) {
            console.error('Audit Log Error (Rate Limit):', err.message);
        }
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * General API Limiter
 */
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req, res) => securitySettingsService.get('security_general_limit') || 1000,
    message: { success: false, message: 'Too many requests. Please slow down.' },
    skip: (req) => req.path.startsWith('/api/kitchen'), // Skip KDS polling
    handler: async (req, res, next, options) => {
        try {
            await logAudit(null, {
                userId: null,
                action: 'rate_limit_api',
                entityType: 'security',
                newValue: { ip: req.ip, path: req.path, reason: 'General API rate limit exceeded' },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        } catch (err) {}
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Public Menu Limiter
 */
const publicMenuLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req, res) => securitySettingsService.get('security_public_limit') || 300,
    message: { success: false, message: 'Public menu access limit reached. Please try again later.' },
    handler: async (req, res, next, options) => {
        try {
            await logAudit(null, {
                userId: null,
                action: 'rate_limit_public_menu',
                entityType: 'security',
                newValue: { ip: req.ip, path: req.path },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        } catch (err) {}
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Payment Status Polling Limiter
 */
const paymentStatusLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: (req, res) => securitySettingsService.get('security_payment_limit') || 120, // 120 requests (allows for polling every ~2.5 seconds)
    message: { success: false, message: 'Payment status check limit reached. Please wait.' },
    handler: async (req, res, next, options) => {
        try {
            await logAudit(null, {
                userId: null,
                action: 'rate_limit_payment_status',
                entityType: 'security',
                newValue: { ip: req.ip, path: req.path },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        } catch (err) {}
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Super Admin Routes Limiter
 */
const superAdminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req, res) => securitySettingsService.get('security_super_admin_limit') || 300,
    message: { success: false, message: 'Too many administrative requests. Please slow down.' },
    handler: async (req, res, next, options) => {
        try {
            await logAudit(null, {
                userId: null,
                action: 'rate_limit_super_admin',
                entityType: 'security',
                newValue: { ip: req.ip, path: req.path },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
        } catch (err) {}
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    generalApiLimiter,
    publicMenuLimiter,
    paymentStatusLimiter,
    superAdminLimiter
};
