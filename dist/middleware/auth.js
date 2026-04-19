"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const auth_1 = require("../lib/auth");
const authenticate = (req, res, next) => {
    const user = (0, auth_1.getUserFromRequest)(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
};
exports.authenticate = authenticate;
