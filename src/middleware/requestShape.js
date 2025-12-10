const allowedContentTypes = ['application/json', 'application/problem+json'];

const requestShape = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';
    const isAllowed = allowedContentTypes.some((type) => contentType.includes(type));
    if (!isAllowed) {
      return res.status(415).json({ error: 'content-type must be application/json' });
    }
  }

  res.setHeader('X-Gateway', 'Interact');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

module.exports = requestShape;
