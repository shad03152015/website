const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const { channels, messages, addMessage } = require('../data/mockData');
const validate = require('../middleware/validate');
const { z } = require('zod');
const { hasChannelPermission, getServerIdFromChannel } = require('../utils/permissions');

const router = express.Router();

const messageHistorySchema = z.object({
  params: z.object({ channelId: z.string().min(1) }),
});

router.get('/channels/:channelId/messages', optionalAuthenticate, validate(messageHistorySchema), (req, res) => {
  const channelMessages = messages.filter((m) => m.channelId === req.params.channelId);
  const channel = channels.find((c) => c.id === req.params.channelId);
  if (!channel) return res.status(404).json({ error: 'channel not found' });
  if (hasChannelPermission(req.user, channel.id, 'read_history')) {
    return res.json(channelMessages);
  }
  if (!req.user && channel.isPublic) {
    return res.json(channelMessages.slice(-10));
  }
  return res.status(403).json({ error: 'forbidden' });
});

const postMessageSchema = z.object({
  params: z.object({ channelId: z.string().min(1) }),
  body: z.object({ content: z.string().min(1) }),
});

router.post('/channels/:channelId/messages', authenticate, validate(postMessageSchema), (req, res) => {
  const channel = channels.find((c) => c.id === req.params.channelId);
  if (!channel) return res.status(404).json({ error: 'channel not found' });
  const serverId = getServerIdFromChannel(channel.id);
  if (!hasChannelPermission(req.user, channel.id, 'post_message')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { content } = req.validated.body;
  const message = addMessage(channel.id, req.user.id, content);
  res.status(201).json(message);
});

const reactionSchema = z.object({
  params: z.object({ messageId: z.string().min(1) }),
  body: z.object({ emoji: z.string().min(1) }),
});

router.post('/messages/:messageId/reactions', authenticate, validate(reactionSchema), (req, res) => {
  const message = messages.find((m) => m.id === req.params.messageId);
  if (!message) return res.status(404).json({ error: 'message not found' });
  const serverId = getServerIdFromChannel(message.channelId);
  if (!hasChannelPermission(req.user, message.channelId, 'add_reaction')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { emoji } = req.validated.body;
  const existing = message.reactions.find((r) => r.emoji === emoji);
  if (existing) {
    existing.count += 1;
  } else {
    message.reactions.push({ id: uuidv4(), emoji, count: 1 });
  }
  res.json(message.reactions);
});

router.post('/channels/:channelId/typing', authenticate, validate(messageHistorySchema), (req, res) => {
  const serverId = getServerIdFromChannel(req.params.channelId);
  if (!hasChannelPermission(req.user, req.params.channelId, 'post_message')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.json({ status: 'typing', channelId: req.params.channelId, userId: req.user.id });
});

module.exports = router;
