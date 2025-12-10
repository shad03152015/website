const { sessions, users } = require('../data/mockData');

const optionalAuthenticate = (req, _res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) {
    const session = sessions.get(token);
    req.user = users.find((u) => u.id === session.userId);
    req.session = session;
  }
  next();
};

module.exports = optionalAuthenticate;
