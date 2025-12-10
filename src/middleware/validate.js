const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.parse({ body: req.body, params: req.params, query: req.query });
    req.validated = result;
    return next();
  } catch (err) {
    const details = err.errors?.map((e) => ({ path: e.path.join('.'), message: e.message })) || [];
    return res.status(400).json({ error: 'invalid_request', details });
  }
};

module.exports = validate;
