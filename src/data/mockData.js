const { v4: uuidv4 } = require('uuid');

const users = [
  {
    id: 'u-1',
    email: 'alice@example.com',
    password: 'password',
    displayName: 'Alice',
    avatarUrl: 'https://placekitten.com/80/80',
    oauthProviders: ['google'],
    settings: { dnd: false },
    twoFactorEnabled: false,
    lastSeenAt: new Date().toISOString(),
  },
];

const servers = [
  {
    id: 's-1',
    ownerId: 'u-1',
    name: 'Design Ops',
    iconUrl: 'https://placekitten.com/64/64',
    description: 'Product design and research',
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
    isPublic: true,
  },
];

const roles = [
  {
    id: 'role-admin',
    serverId: 's-1',
    name: 'Admin',
    allowed: ['*'],
    denied: [],
    position: 1,
    isDefault: false,
  },
  {
    id: 'role-moderator',
    serverId: 's-1',
    name: 'Moderator',
    allowed: [
      'manage_server_configuration',
      'manage_roles',
      'manage_permissions',
      'manage_channels',
      'manage_invites',
      'moderate_users',
      'moderate_content',
      'manage_reports',
      'view_audit_logs',
      'set_media_limits',
    ],
    denied: [],
    position: 1,
    isDefault: false,
  },
  {
    id: 'role-member',
    serverId: 's-1',
    name: 'Member',
    allowed: [
      'view_channel',
      'read_history',
      'post_message',
      'upload_media',
      'add_reaction',
      'start_thread',
      'use_mentions',
      'search',
      'join_voice',
      'stream_voice',
      'share_screen',
      'pin_message',
    ],
    denied: ['manage_server_configuration'],
    position: 2,
    isDefault: true,
  },
];

const memberships = [
  {
    userId: 'u-1',
    serverId: 's-1',
    roleIds: ['role-admin'],
    joinedAt: new Date().toISOString(),
    notificationPrefs: { mentions: true },
  },
];

const channels = [
  {
    id: 'c-1',
    serverId: 's-1',
    type: 'text',
    name: 'announcements',
    topic: 'Product updates',
    permissionOverrides: [
      { roleId: 'everyone', allow: ['view_channel', 'read_history'], deny: [] },
      { roleId: 'role-member', allow: ['post_message'], deny: [] },
    ],
    rateLimit: 0,
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
  {
    id: 'c-2',
    serverId: 's-1',
    type: 'voice',
    name: 'design-standup',
    topic: 'Daily sync',
    permissionOverrides: [
      { roleId: 'everyone', allow: ['view_channel'], deny: [] },
      { roleId: 'role-member', allow: ['join_voice', 'stream_voice', 'share_screen'], deny: [] },
      { roleId: 'role-moderator', allow: ['control_participants'], deny: [] },
    ],
    rateLimit: 0,
    createdAt: new Date().toISOString(),
    isPublic: true,
  },
];

const invites = [
  {
    code: 'join-design',
    serverId: 's-1',
    channelId: 'c-1',
    creatorId: 'u-1',
    expiresAt: null,
    maxUses: 10,
    uses: 0,
    temporary: false,
    revoked: false,
    createdAt: new Date().toISOString(),
  },
];

const messages = [
  {
    id: 'm-1',
    channelId: 'c-1',
    authorId: 'u-1',
    content: 'Welcome to Interact backend prototype!',
    createdAt: new Date().toISOString(),
    editedAt: null,
    reactions: [],
  },
];

const reports = [];

const sessions = new Map();

const addMessage = (channelId, authorId, content) => {
  const message = {
    id: uuidv4(),
    channelId,
    authorId,
    content,
    createdAt: new Date().toISOString(),
    editedAt: null,
    reactions: [],
  };
  messages.push(message);
  return message;
};

module.exports = {
  users,
  servers,
  roles,
  memberships,
  channels,
  invites,
  messages,
  reports,
  sessions,
  addMessage,
};
