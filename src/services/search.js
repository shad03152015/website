const express = require('express');
const authenticate = require('../middleware/authenticate');
const { messages, channels, users } = require('../data/mockData');
const validate = require('../middleware/validate');
const { z } = require('zod');
const { hasChannelPermission } = require('../utils/permissions');

const router = express.Router();

router.use(authenticate);

const searchSchema = z.object({
  query: z.object({ q: z.string().min(1) }),
});

router.get('/search', validate(searchSchema), (req, res) => {
  const { q } = req.validated.query;
  const lower = q.toLowerCase();
  const results = messages
    .filter((m) => m.content.toLowerCase().includes(lower))
    .filter((m) => hasChannelPermission(req.user, m.channelId, 'read_history'))
    .map((m) => ({
      id: m.id,
      channel: channels.find((c) => c.id === m.channelId)?.name,
      author: users.find((u) => u.id === m.authorId)?.displayName,
      content: m.content,
      createdAt: m.createdAt,
    }));
  res.json({ total: results.length, results });
});

module.exports = router;
