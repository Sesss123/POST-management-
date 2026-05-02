const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = decoded;
            next();
        } catch (error) {
            console.error(error);
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

module.exports = { protect, adminOnly, authorize };
