/**
 * Zod request-body validator. Mounts in front of any route that takes JSON
 * input. Drops a parsed payload onto req.valid (does NOT mutate req.body).
 *
 * Usage:
 *   const { validate } = require('../middleware/validate');
 *   router.post('/x', validate(MyZodSchema), handler);
 *
 * Dependencies:
 *   "zod": "^3.23.8"
 */

function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`);
      return res.status(400).json({ error: 'invalid request', details: issues });
    }
    req.valid = result.data;
    next();
  };
}

module.exports = { validate };
