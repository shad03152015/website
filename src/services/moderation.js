const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/authenticate');
const { reports, messages } = require('../data/mockData');
const validate = require('../middleware/validate');
const { z } = require('zod');
const { getServerIdFromChannel, hasPermission, hasChannelPermission } = require('../utils/permissions');

const router = express.Router();

router.use(authenticate);

const reportSchema = z.object({
  body: z.object({
    messageId: z.string().min(1),
    reason: z.string().min(3),
  }),
});

router.post('/reports', validate(reportSchema), (req, res) => {
  const { messageId, reason } = req.validated.body;
  const target = messages.find((m) => m.id === messageId);
  if (!target) return res.status(404).json({ error: 'message not found' });
  if (!hasChannelPermission(req.user, target.channelId, 'read_history')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const report = { id: uuidv4(), reporterId: req.user.id, messageId, reason, status: 'open', createdAt: new Date().toISOString() };
  reports.push(report);
  res.status(201).json(report);
});

const reportActionSchema = z.object({
  params: z.object({ reportId: z.string().min(1) }),
  body: z.object({ action: z.enum(['mute', 'ban', 'dismiss', 'delete_message']) }),
});

router.post('/reports/:reportId/action', validate(reportActionSchema), (req, res) => {
  const { action } = req.validated.body;
  const report = reports.find((r) => r.id === req.params.reportId);
  if (!report) return res.status(404).json({ error: 'report not found' });
  const target = messages.find((m) => m.id === report.messageId);
  const serverId = target ? getServerIdFromChannel(target.channelId) : null;
  if (!serverId || !hasPermission(req.user, serverId, 'moderate_content')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  report.status = 'resolved';
  report.action = action;
  if (action === 'delete_message' && target) {
    target.deletedAt = new Date().toISOString();
    target.content = '[deleted by moderation]';
  }
  res.json(report);
});

router.get('/reports', (req, res) => {
  const visibleReports = reports.filter((report) => {
    const target = messages.find((m) => m.id === report.messageId);
    const serverId = target ? getServerIdFromChannel(target.channelId) : null;
    return serverId && hasPermission(req.user, serverId, 'moderate_content');
  });
  res.json(visibleReports);
});

module.exports = router;
