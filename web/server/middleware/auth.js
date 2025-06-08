const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    try {
        // Check if JWT_SECRET is defined
        if (!JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ 
                message: 'Server configuration error',
                error: 'JWT_SECRET is not configured'
            });
        }

        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Authorization header is missing',
                error: 'NO_AUTH_HEADER'
            });
        }

        // Check token format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Invalid token format',
                error: 'INVALID_TOKEN_FORMAT'
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                message: 'No token provided',
                error: 'NO_TOKEN'
            });
        }

        // Verify token
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Validate token payload
            if (!decoded || !decoded.id) {
                return res.status(401).json({ 
                    message: 'Invalid token payload',
                    error: 'INVALID_TOKEN_PAYLOAD'
                });
            }

            // Check token expiration
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return res.status(401).json({ 
                    message: 'Token has expired',
                    error: 'TOKEN_EXPIRED'
                });
            }

            // Add user to request
            req.user = decoded;
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token has expired',
                    error: 'TOKEN_EXPIRED'
                });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: 'Invalid token',
                    error: 'INVALID_TOKEN'
                });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            message: 'Authentication error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
        });
    }
}; 