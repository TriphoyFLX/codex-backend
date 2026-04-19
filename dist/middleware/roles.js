"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTeacher = exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireTeacher = (0, exports.requireRole)(['TEACHER', 'ADMIN']);
