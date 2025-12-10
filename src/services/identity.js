const express = require('express');
const authenticate = require('../middleware/authenticate');
const { users, memberships, servers } = require('../data/mockData');
const validate = require('../middleware/validate');
const { z } = require('zod');

const router = express.Router();

router.use(authenticate);

router.get('/me', (req, res) => {
  res.json(req.user);
});

router.get('/directory', (req, res) => {
  const { q } = req.query;
  const result = users
    .filter((u) => !q || u.displayName.toLowerCase().includes(q.toLowerCase()))
    .map((u) => ({ id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl, lastSeenAt: u.lastSeenAt }));
  res.json(result);
});

router.get('/servers', (req, res) => {
  const joined = memberships.filter((m) => m.userId === req.user.id).map((m) => servers.find((s) => s.id === m.serverId));
  res.json(joined.filter(Boolean));
});

const relationshipSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1),
    action: z.enum(['follow', 'block', 'unblock']),
  }),
});

router.post('/relationships', validate(relationshipSchema), (req, res) => {
  const { targetUserId, action } = req.validated.body;
  res.json({ status: 'ok', action, targetUserId });
});

module.exports = router;
