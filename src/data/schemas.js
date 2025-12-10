const userSchema = {
  bsonType: 'object',
  required: ['id', 'email', 'display_name', 'created_at'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string', description: 'Stable user id (UUID/string)' },
    email: { bsonType: 'string' },
    password_hash: { bsonType: 'string' },
    oauth_providers: {
      bsonType: 'array',
      items: { bsonType: 'string' },
    },
    display_name: { bsonType: 'string' },
    avatar_url: { bsonType: 'string' },
    created_at: { bsonType: 'date' },
    last_seen_at: { bsonType: 'date' },
    settings: { bsonType: 'object' },
    '2fa_enabled': { bsonType: 'bool' },
  },
};

const serverSchema = {
  bsonType: 'object',
  required: ['id', 'owner_id', 'name', 'created_at'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    owner_id: { bsonType: 'string' },
    name: { bsonType: 'string' },
    icon_url: { bsonType: 'string' },
    description: { bsonType: 'string' },
    settings: { bsonType: 'object' },
    default_role_id: { bsonType: 'string' },
    created_at: { bsonType: 'date' },
  },
};

const channelSchema = {
  bsonType: 'object',
  required: ['id', 'server_id', 'type', 'name', 'created_at'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    server_id: { bsonType: 'string' },
    type: { bsonType: 'string', enum: ['text', 'voice', 'video'] },
    name: { bsonType: 'string' },
    topic: { bsonType: 'string' },
    category_id: { bsonType: 'string' },
    position: { bsonType: 'int' },
    permission_overrides: {
      bsonType: 'array',
      items: {
        bsonType: 'object',
        properties: {
          role_id: { bsonType: 'string' },
          allow: {
            bsonType: 'array',
            items: { bsonType: 'string' },
          },
          deny: {
            bsonType: 'array',
            items: { bsonType: 'string' },
          },
        },
      },
    },
    rate_limit: { bsonType: 'int' },
    created_at: { bsonType: 'date' },
  },
};

const roleSchema = {
  bsonType: 'object',
  required: ['id', 'server_id', 'name', 'position'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    server_id: { bsonType: 'string' },
    name: { bsonType: 'string' },
    color: { bsonType: 'string' },
    position: { bsonType: 'int' },
    allowed_flags: {
      bsonType: 'array',
      items: { bsonType: 'string' },
    },
    denied_flags: {
      bsonType: 'array',
      items: { bsonType: 'string' },
    },
    is_default: { bsonType: 'bool' },
  },
};

const membershipSchema = {
  bsonType: 'object',
  required: ['user_id', 'server_id', 'role_ids', 'joined_at'],
  properties: {
    _id: { bsonType: 'objectId' },
    user_id: { bsonType: 'string' },
    server_id: { bsonType: 'string' },
    role_ids: {
      bsonType: 'array',
      items: { bsonType: 'string' },
    },
    joined_at: { bsonType: 'date' },
    nick: { bsonType: 'string' },
    notification_prefs: { bsonType: 'object' },
    status: { bsonType: 'string' },
  },
};

const inviteSchema = {
  bsonType: 'object',
  required: ['id', 'server_id', 'channel_id', 'creator_id', 'created_at'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    server_id: { bsonType: 'string' },
    channel_id: { bsonType: 'string' },
    creator_id: { bsonType: 'string' },
    expires_at: { bsonType: 'date' },
    max_uses: { bsonType: 'int' },
    uses: { bsonType: 'int' },
    temporary: { bsonType: 'bool' },
    revoked: { bsonType: 'bool' },
    created_at: { bsonType: 'date' },
  },
};

const messageSchema = {
  bsonType: 'object',
  required: ['id', 'channel_id', 'author_id', 'type', 'content', 'created_at'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    channel_id: { bsonType: 'string' },
    author_id: { bsonType: 'string' },
    type: { bsonType: 'string' },
    content: { bsonType: 'string' },
    embeds: { bsonType: 'array' },
    attachments: { bsonType: 'array' },
    mentions: { bsonType: 'array' },
    thread_id: { bsonType: 'string' },
    reactions: { bsonType: 'array' },
    created_at: { bsonType: 'date' },
    edited_at: { bsonType: 'date' },
    deleted_at: { bsonType: 'date' },
    pinned: { bsonType: 'bool' },
    flags: { bsonType: 'array' },
    audit: { bsonType: 'object' },
  },
};

const threadSchema = {
  bsonType: 'object',
  required: ['id', 'parent_message_id', 'channel_id'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    parent_message_id: { bsonType: 'string' },
    channel_id: { bsonType: 'string' },
    archived_at: { bsonType: 'date' },
    locked: { bsonType: 'bool' },
    auto_archive_at: { bsonType: 'date' },
    owner_id: { bsonType: 'string' },
  },
};

const presenceSchema = {
  bsonType: 'object',
  required: ['user_id', 'server_id', 'status', 'last_heartbeat'],
  properties: {
    _id: { bsonType: 'objectId' },
    user_id: { bsonType: 'string' },
    server_id: { bsonType: 'string' },
    status: { bsonType: 'string', enum: ['online', 'dnd', 'away', 'offline'] },
    activity: { bsonType: 'string' },
    voice_channel_id: { bsonType: 'string' },
    muted: { bsonType: 'bool' },
    deafened: { bsonType: 'bool' },
    streaming: { bsonType: 'bool' },
    last_heartbeat: { bsonType: 'date' },
  },
};

const auditLogSchema = {
  bsonType: 'object',
  required: ['id', 'server_id', 'actor_id', 'action', 'created_at'],
  properties: {
    _id: { bsonType: 'objectId' },
    id: { bsonType: 'string' },
    server_id: { bsonType: 'string' },
    actor_id: { bsonType: 'string' },
    action: { bsonType: 'string' },
    target: { bsonType: 'string' },
    metadata: { bsonType: 'object' },
    created_at: { bsonType: 'date' },
    ip: { bsonType: 'string' },
  },
};

const collectionValidators = {
  users: userSchema,
  servers: serverSchema,
  channels: channelSchema,
  roles: roleSchema,
  memberships: membershipSchema,
  invites: inviteSchema,
  messages: messageSchema,
  threads: threadSchema,
  presence: presenceSchema,
  audit_logs: auditLogSchema,
};

module.exports = { collectionValidators };
