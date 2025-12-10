const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const { servers, channels, roles, memberships, invites } = require('../data/mockData');
const validate = require('../middleware/validate');
const { z } = require('zod');
const { hasPermission } = require('../utils/permissions');

const router = express.Router();

router.get('/public/servers', optionalAuthenticate, (_req, res) => {
  const publicServers = servers
    .filter((s) => s.isPublic)
    .map((server) => ({
      server,
      channels: channels.filter((c) => c.serverId === server.id && c.isPublic),
    }));
  res.json(publicServers);
});

router.get('/servers/:serverId', optionalAuthenticate, (req, res) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'not found' });
  const membership = req.user && memberships.find((m) => m.userId === req.user.id && m.serverId === server.id);
  const canView = membership || (req.user && hasPermission(req.user, server.id, 'view_channel'));
  if (!canView && !server.isPublic) return res.status(403).json({ error: 'forbidden' });
  const serverChannels = channels.filter((c) => c.serverId === server.id && (canView || c.isPublic));
  const serverRoles = canView ? roles.filter((r) => r.serverId === server.id) : [];
  const serverInvites = canView ? invites.filter((i) => i.serverId === server.id) : [];
  res.json({ server, channels: serverChannels, roles: serverRoles, invites: serverInvites });
});

const createServerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  }),
});

router.post('/servers', authenticate, validate(createServerSchema), (req, res) => {
  const { name, description } = req.validated.body;
  const server = {
    id: uuidv4(),
    ownerId: req.user.id,
    name,
    description,
    iconUrl: '',
    defaultRoleId: 'role-member',
    settings: {
      defaultPermissions: [
        'view_channel',
        'read_history',
        'post_message',
        'add_reaction',
        'start_thread',
        'use_mentions',
        'upload_media',
      ],
    },
    createdAt: new Date().toISOString(),
    isPublic: false,
  };
  servers.push(server);
  memberships.push({ userId: req.user.id, serverId: server.id, roleIds: ['role-admin'], joinedAt: new Date().toISOString() });
  res.status(201).json(server);
});

const createChannelSchema = z.object({
  params: z.object({ serverId: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1),
    type: z.enum(['text', 'voice', 'video']).default('text'),
    isPublic: z.boolean().default(false),
  }),
});

router.post('/servers/:serverId/channels', authenticate, validate(createChannelSchema), (req, res) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'server not found' });
  const canCreate = hasPermission(req.user, server.id, 'manage_channels');
  if (!canCreate) return res.status(403).json({ error: 'forbidden' });
  const { name, type, isPublic } = req.validated.body;
  const channel = {
    id: uuidv4(),
    serverId: server.id,
    name,
    type,
    topic: '',
    permissionOverrides: [
      { roleId: 'everyone', allow: ['view_channel', 'read_history'], deny: [] },
    ],
    rateLimit: 0,
    createdAt: new Date().toISOString(),
    isPublic,
  };
  channels.push(channel);
  res.status(201).json(channel);
});

const inviteSchema = z.object({
  params: z.object({ serverId: z.string().min(1) }),
  body: z.object({
    channelId: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    maxUses: z.number().int().positive().optional(),
  }),
});

router.post('/servers/:serverId/invites', authenticate, validate(inviteSchema), (req, res) => {
  const server = servers.find((s) => s.id === req.params.serverId);
  if (!server) return res.status(404).json({ error: 'server not found' });
  if (!hasPermission(req.user, server.id, 'manage_invites')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { channelId, expiresAt, maxUses = 1 } = req.validated.body;
  const invite = {
    code: uuidv4().split('-')[0],
    serverId: server.id,
    channelId: channelId || null,
    creatorId: req.user.id,
    expiresAt: expiresAt || null,
    maxUses,
    uses: 0,
    temporary: false,
    revoked: false,
    createdAt: new Date().toISOString(),
  };
  invites.push(invite);
  res.status(201).json(invite);
});

const acceptInviteSchema = z.object({
  params: z.object({ code: z.string().min(1) }),
});

router.post('/invites/:code/accept', authenticate, validate(acceptInviteSchema), (req, res) => {
  const invite = invites.find((i) => i.code === req.params.code && !i.revoked);
  if (!invite) return res.status(404).json({ error: 'invite not found' });
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'expired' });
  }
  if (invite.uses >= invite.maxUses) return res.status(410).json({ error: 'invite exhausted' });
  invite.uses += 1;
  memberships.push({ userId: req.user.id, serverId: invite.serverId, roleIds: ['role-member'], joinedAt: new Date().toISOString() });
  res.json({ status: 'joined', serverId: invite.serverId, channelId: invite.channelId });
});

const roleSchema = z.object({
  params: z.object({ serverId: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1),
    allowed: z.array(z.string()).default([]),
    denied: z.array(z.string()).default([]),
  }),
});

router.post('/servers/:serverId/roles', authenticate, validate(roleSchema), (req, res) => {
  if (!hasPermission(req.user, req.params.serverId, 'manage_roles')) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { name, allowed = [], denied = [] } = req.validated.body;
  const role = {
    id: uuidv4(),
    serverId: req.params.serverId,
    name,
    allowed,
    denied,
    position: roles.length + 1,
    isDefault: false,
  };
  roles.push(role);
  res.status(201).json(role);
});

module.exports = router;
