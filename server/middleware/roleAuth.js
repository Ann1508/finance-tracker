// middleware/roleAuth.js
const roleAuth = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }

        if (requiredRole === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Требуются права администратора' });
        }

        next();
    };
};

module.exports = roleAuth;