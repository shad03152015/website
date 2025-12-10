const { memberships, roles, channels, servers } = require('../data/mockData');

const GLOBAL_REGISTERED_PERMISSIONS = new Set([
  'create_server',
  'join_server',
  'manage_notifications',
  'search',
  'start_thread',
  'add_reaction',
  'upload_media',
]);

const GUEST_PERMISSIONS = new Set(['browse_public', 'preview_history']);
const PUBLIC_CHANNEL_PERMISSIONS = new Set(['view_channel', 'read_history']);

const hasWildcard = (role) => role.allowed?.includes('*');

const mergeRolePermissions = (roleIds = []) => {
  const allowed = new Set();
  const denied = new Set();
  roleIds.forEach((roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    if (hasWildcard(role)) {
      allowed.add('*');
    }
    (role.allowed || []).forEach((p) => allowed.add(p));
    (role.denied || []).forEach((p) => denied.add(p));
  });
  return { allowed, denied };
};

const applyOverrides = (permissionOverrides = [], roleIds = [], allowed, denied) => {
  permissionOverrides.forEach((override) => {
    if (override.roleId && !roleIds.includes(override.roleId) && override.roleId !== 'everyone') return;
    (override.allow || []).forEach((p) => allowed.add(p));
    (override.deny || []).forEach((p) => denied.add(p));
  });
};

const resolveServerPermissions = (user, serverId) => {
  if (!user) {
    return new Set(GUEST_PERMISSIONS);
  }
  const permissions = new Set(GLOBAL_REGISTERED_PERMISSIONS);
  if (!serverId) return permissions;
  const membership = memberships.find((m) => m.userId === user.id && m.serverId === serverId);
  if (!membership) return permissions;
  const { allowed, denied } = mergeRolePermissions(membership.roleIds);
  if (allowed.has('*')) return new Set(['*']);
  allowed.forEach((p) => {
    if (!denied.has(p)) permissions.add(p);
  });
  denied.forEach((p) => permissions.delete(p));
  return permissions;
};

const resolveChannelPermissions = (user, channelId) => {
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) return new Set();
  const server = servers.find((s) => s.id === channel.serverId);
  if (!user) {
    const guestAllowed = new Set(GUEST_PERMISSIONS);
    if (channel.isPublic) {
      PUBLIC_CHANNEL_PERMISSIONS.forEach((p) => guestAllowed.add(p));
    }
    return guestAllowed;
  }

  const membership = memberships.find((m) => m.userId === user.id && m.serverId === channel.serverId);
  const baseAllowed = new Set(server?.settings?.defaultPermissions || []);
  const baseDenied = new Set();

  if (!membership) {
    if (channel.isPublic) {
      PUBLIC_CHANNEL_PERMISSIONS.forEach((p) => baseAllowed.add(p));
    }
    return baseAllowed;
  }

  const { allowed: roleAllowed, denied: roleDenied } = mergeRolePermissions(membership.roleIds);
  if (roleAllowed.has('*')) return new Set(['*']);

  roleAllowed.forEach((p) => baseAllowed.add(p));
  roleDenied.forEach((p) => baseDenied.add(p));

  applyOverrides(channel.permissionOverrides, membership.roleIds, baseAllowed, baseDenied);

  baseDenied.forEach((p) => baseAllowed.delete(p));
  return baseAllowed;
};

const hasPermission = (user, serverId, permission) => {
  const permissions = resolveServerPermissions(user, serverId);
  return permissions.has('*') || permissions.has(permission);
};

const hasChannelPermission = (user, channelId, permission) => {
  const permissions = resolveChannelPermissions(user, channelId);
  return permissions.has('*') || permissions.has(permission);
};

const getServerIdFromChannel = (channelId) => {
  const channel = channels.find((c) => c.id === channelId);
  return channel?.serverId;
};

const assertPermission = (permission, serverIdResolver) => (req, res, next) => {
  const serverId = typeof serverIdResolver === 'function' ? serverIdResolver(req) : serverIdResolver;
  if (!serverId) return res.status(400).json({ error: 'serverId required for permission check' });
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  if (!hasPermission(req.user, serverId, permission)) {
    return res.status(403).json({ error: 'forbidden', permission });
  }
  next();
};

module.exports = {
  resolveServerPermissions,
  resolveChannelPermissions,
  hasPermission,
  hasChannelPermission,
  assertPermission,
  getServerIdFromChannel,
  GUEST_PERMISSIONS,
};
