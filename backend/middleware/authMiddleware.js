const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check Token Version for Revocation (Fix 6)
            if (decoded.token_version !== undefined) {
                const [users] = await db.query('SELECT token_version FROM users WHERE id = ?', [decoded.id]);
                if (users.length === 0 || users[0].token_version !== decoded.token_version) {
                    return res.status(401).json({ success: false, message: 'Session revoked. Please login again.' });
                }
            }

            req.user = decoded;
            next();
        } catch (error) {
            console.error('[AUTH MIDDLEWARE] Token verification failed:', error.message);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as an admin' });
    }
};

const authorize = (...roles) => {
    return async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            const { logAudit } = require('../utils/auditLogger');
            await logAudit(null, {
                userId: req.user.id,
                action: 'unauthorized_access_attempt',
                entityType: 'route',
                newValue: { 
                    method: req.method, 
                    path: req.originalUrl, 
                    required_roles: roles,
                    user_role: req.user.role 
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

/**
 * requirePermission
 * Checks if user has a specific permission key.
 * Hierarchy: SuperAdmin -> User Override -> Role Default -> Admin Fallback
 */
const requirePermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            if (req.user.role === 'super_admin') return next();

            // 1. Check User Overrides
            const [userOverride] = await db.query(`
                SELECT up.value 
                FROM user_permissions up
                JOIN permissions p ON up.permission_id = p.id
                WHERE up.user_id = ? AND p.perm_key = ? AND up.shop_id = ?
            `, [req.user.id, permissionKey, req.user.shopId]);

            if (userOverride.length > 0) {
                if (userOverride[0].value) return next();
                else return res.status(403).json({ 
                    success: false, 
                    message: `Permission denied for: ${permissionKey}` 
                });
            }

            // 2. Check Role Defaults
            const [roleDefault] = await db.query(`
                SELECT 1 
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                WHERE rp.role = ? AND p.perm_key = ? AND rp.shop_id = ?
            `, [req.user.role, permissionKey, req.user.shopId]);

            if (roleDefault.length > 0) return next();

            // 3. Fallback: Shop Admin has everything unless explicitly denied above
            if (req.user.role === 'admin') return next();

            return res.status(403).json({ 
                success: false, 
                message: `You do not have permission to: ${permissionKey}` 
            });
        } catch (error) {
            console.error('[requirePermission Error]', error);
            res.status(500).json({ success: false, message: 'Internal permission check error' });
        }
    };
};

module.exports = { protect, adminOnly, authorize, requirePermission };
