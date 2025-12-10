const { sessions, users } = require('../data/mockData');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const session = sessions.get(token);
  req.user = users.find((u) => u.id === session.userId);
  req.session = session;
  next();
};

module.exports = authenticate;
