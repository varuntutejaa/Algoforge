const crypto = require("crypto");

// Constant-time comparison against ADMIN_API_KEY, gating admin-only routes.
function requireAdminKey(req, res, next) {
    const configuredKey = process.env.ADMIN_API_KEY;
    const suppliedKey = req.headers["x-admin-key"] || "";

    if (!configuredKey) {
        return res.status(503).json({ success: false, message: "Admin access is not configured" });
    }

    const configuredBuf = Buffer.from(configuredKey);
    const suppliedBuf = Buffer.from(suppliedKey);

    const matches =
        configuredBuf.length === suppliedBuf.length &&
        crypto.timingSafeEqual(configuredBuf, suppliedBuf);

    if (!matches) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
}

module.exports = { requireAdminKey };
