# Interact: Real-time Communication Platform Design

## Overview
Interact is a real-time communication platform focused on accessibility-first collaboration across text, voice, and video. The design emphasizes role-based permissions, reliable messaging, and robust moderation to support communities of any size.

## UX Flows
- **Onboarding:** Account creation or OAuth, profile basics, guided tutorial for first server creation or joining via invite.
- **Server Discovery/Joining:** Directory search/browse, invite redemption, preview before join, consent for permissions.
- **Navigation:** Sidebar of servers/channels with unread badges, keyboard shortcuts, quick switcher, ARIA and screen reader labels.
- **Messaging:** Inline composer with markdown/emoji/autocomplete, message threading, reactions, mentions with previews, typing indicators and presence chips.
- **Notifications:** Per-channel/thread settings, snooze/do-not-disturb, push subscription prompts, inbox for mentions/replies.
- **Media & Voice/Video:** Drag-and-drop uploads with progress, inline playback, join voice/video with device checks, screen share and hand-raise controls.
- **Settings Panels:** Profile, privacy, notifications, keybinds, accessibility, audit/security sessions, data export, moderation panels for admins.
- **Accessibility:** Keyboard navigation for all actions, focus management, ARIA roles/labels, high-contrast and reduced-motion modes.
- **UX Flow Coach:** Interactive checklist surfacing each user journey (onboarding, discovery, navigation, messaging, notifications, media/voice, settings, accessibility) with call-to-action buttons that open the relevant UI and record completion.

## User Roles and Permissions
- **Guest**
  - Can browse public servers and channels when explicitly allowed.
  - Can receive invites but must register to accept; limited preview of message history.
  - No ability to post messages, upload media, or participate in voice/video.
- **Registered User**
  - Can join servers via invite links or directory, read/post in channels where permitted.
  - Can send/receive DMs, react to messages, start threads, upload media, and search within allowed scopes.
  - Can create servers, channels (text/voice/video), and manage personal notification settings.
- **Moderator/Admin (per server)**
  - Can manage server settings, channels, roles, permissions, invites, and member states.
  - Can mute/kick/ban members, handle reports, review audit logs, and configure moderation automations.
  - Can set media limits, approval queues, and bulk actions (delete messages, close threads).

### Permission Surface (per channel with server-wide defaults)
- View channel, read history, post messages, upload media.
- Start threads, add reactions, use mentions, pin messages, manage webhooks/integrations.
- Join/stream in voice/video, share screen, control participants (mute/deafen/move).
- Manage roles/permissions, manage invites, manage channels, manage server configuration.
- Moderate content/users: delete messages, timeout/mute/ban, manage reports, view audit logs.

## Core Features
- **Server & Channel Management:** Create/edit/delete servers; hierarchical channels (text/voice/video) with categories; channel-level overrides for roles/permissions; slow mode and rate limits.
- **Roles & Permissions:** Role hierarchy with allow/deny flags; per-channel overrides; role assignment via UI and invite rules.
- **Invites:** Time-limited or use-limited invite links; vanity URLs; invite usage tracking and revocation.
- **Real-time Messaging:** WebSocket-based delivery; typing indicators; read receipts; presence; message editing/deleting with audit trails; ephemeral system events (joins, leaves, role changes).
- **Reactions & Threads:** Emoji reactions with counts; threaded replies; thread auto-archival; per-thread notification settings.
- **Media Uploads:** Images/videos/files with virus scanning; transcoding/thumbnails; size/type limits; inline playback; CDN-backed delivery.
- **Search:** Full-text and structured filters (user, channel, date, has:media/links); relevance ranking; pagination; privacy-aware scoping.
- **Notifications:** In-app toasts, activity feed, and push notifications; mention/highlight rules; configurable per channel/thread.
- **Moderation:** User reports with evidence; ban/mute/timeout; automated filters (spam, profanity, malware); appeal workflow; audit logs for privileged actions.

## System Architecture
### Frontend
- Single-page app (React or Vue) consuming GraphQL/REST APIs via an API gateway. The prototype UI functions as a single-page shell and illustrates the same flows.
- Client state store for sessions, permissions, and message cache; offline caching for recent messages and optimistic UI updates (the prototype persists channel history to localStorage).
- Accessibility-first components with ARIA labeling, focus management, and keyboard-first navigation.

### Real-time Transport
- WebSockets for messaging, presence, and typing indicators, anchored by sticky sessions.
- WebRTC for voice, video, and screen share with TURN/STUN support; SFU for scalable group sessions.

### Backend Services (microservice-friendly boundaries)
- **Auth service:** Password/OAuth/2FA, session/refresh token issuance, device management.
- **Identity/Directory service:** Profiles, discovery, relationships, and status.
- **Server/Channel service:** Structure, roles, permissions, invites, audit logs.
- **Messaging service:** Text/threads/reactions, delivery fanout, WebSocket gateway coordination.
- **Media service:** Upload API, virus scan, transcoding, storage orchestration, CDN publishing.
- **Search service:** Indexing pipeline and query API with relevance tuning and privacy filters.
- **Moderation service:** Reports, enforcement, automation rules, appeal flows.

### API Gateway
Fronts public traffic; handles authentication, rate limiting, request shaping, schema validation, and routing to backend services. A co-located GraphQL endpoint (`/graphql`) provides a typed aggregation surface for servers/channels/messages alongside the existing REST routes.

## Data Storage
- **MongoDB:** Primary store for users, servers, channels, roles, memberships, invites, presence, audit logs, and message thread metadata with collection validators to enforce the conceptual schemas.
- **NoSQL/append-only streams (Cassandra/DynamoDB/Kafka):** Messages/events with time-partitioning for high write throughput.
- **Object storage (S3/GCS):** Media and attachments with CDN in front and lifecycle policies for cold storage.
- **Search index (OpenSearch/Elasticsearch):** Fed via event pipelines for full-text and structured queries.

## Data Models (Conceptual)
- **User:** `id`, `email`, `password_hash`, `oauth_providers`, `display_name`, `avatar_url`, `created_at`, `last_seen_at`, `settings`, `2fa_enabled`.
- **Server:** `id`, `owner_id`, `name`, `icon_url`, `description`, `settings`, `default_role_id`, `created_at`.
- **Channel:** `id`, `server_id`, `type` (text/voice/video), `name`, `topic`, `category_id`, `position`, `permission_overrides[]`, `rate_limit`, `created_at`.
- **Role/Permission:** `id`, `server_id`, `name`, `color`, `position`, `allowed_flags`, `denied_flags`, `is_default`.
- **Membership:** `user_id`, `server_id`, `role_ids[]`, `joined_at`, `nick`, `notification_prefs`, `status`.
- **Invite:** `id`/`code`, `server_id`, `channel_id`, `creator_id`, `expires_at`, `max_uses`, `uses`, `temporary`, `revoked`, `created_at`.
- **Message:** `id`, `channel_id`, `author_id`, `type`, `content`, `embeds`, `attachments[]`, `mentions[]`, `thread_id`, `reactions[]`, `created_at`, `edited_at`, `deleted_at`, `pinned`, `flags` (nsfw/system/ephemeral), `audit`.
- **Thread:** `id`, `parent_message_id`, `channel_id`, `archived_at`, `locked`, `auto_archive_at`, `owner_id`.
- **Presence/Voice State:** `user_id`, `server_id`, `status` (online/dnd/away/offline), `activity`, `voice_channel_id`, `muted`, `deafened`, `streaming`, `last_heartbeat`.
- **Audit Log:** `id`, `server_id`, `actor_id`, `action`, `target`, `metadata`, `created_at`, `ip`.

### MongoDB Collection Validators
The backend prototype ships JSON Schema-based validators for the MongoDB collections in `src/data/schemas.js`, covering users, servers, channels, roles, memberships, invites, messages, threads, presence, and audit logs. Validators enforce required keys, enums (such as channel type or presence status), and shape expectations for permission overrides, reactions, and audit metadata.

Permission enforcement uses server defaults that inherit down to channels and are refined by per-role channel overrides. Guests inherit only public channel permissions (view/read), members inherit the server defaults plus their roles’ allow/deny flags, and moderators/admins gain moderation, invite, and configuration abilities aligned to the permission surface.

## Scalability & Infrastructure
- Horizontal scaling for stateless services behind load balancers with auto-scaling groups.
- WebSocket gateways sharded by user/server; sticky sessions via tokens; presence fanout via pub/sub.
- Event streams (Kafka/PubSub) for message fanout, search indexing, audit logging, and moderation pipelines.
- Caching (Redis/Memcached) for permissions, presence, and recent messages with write-through/invalidation strategies.
- Rate limiting per IP/user/token at the gateway; adaptive limits for media and invite generation.
- CDN for media and static assets; object lifecycle policies for cost-efficient storage.
- TURN/STUN servers for WebRTC NAT traversal; SFU for scalable group voice/video.
- Observability: centralized logging, metrics, distributed tracing, alerting, and automated runbooks.

## Security & Privacy
- Authentication via email/password plus OAuth (Google/GitHub/etc.) with secure session tokens and refresh/access rotation.
- 2FA (TOTP/WebAuthn), device management, and trusted device prompts.
- Encryption in transit (TLS everywhere) and encryption at rest for secrets and sensitive fields.
- Optional end-to-end encryption for DMs and small private groups with key verification and secure key backup.
- Spam/abuse mitigation: CAPTCHAs on signup/invites, rate limits, reputation scoring, content scanning, link safety checks.
- Data retention: configurable retention for channels/threads; right-to-erasure workflows; export/download tools.
- Compliance: GDPR/CCPA-ready data handling, audit trails, least-privilege access for staff, secure logging, and key management.

## Testing Strategy
- Unit tests for services (auth, permissions, messaging formatting) and database migration tests.
- Integration tests for REST/GraphQL APIs and contract tests for WebSocket events (joins, messages, presence, typing).
- End-to-end tests for onboarding, server creation, channel messaging, DMs, reactions/threads, media uploads, and moderation flows.
- Load and soak tests for messaging fanout, WebSocket gateway capacity, and voice/video SFU throughput; chaos testing for resilience.

## Backend Prototype (Node + Express)
A lightweight gateway exposes modular routers that mirror the platform services:
- **/auth** for registration, password/OAuth sign-in, token refresh, and session listing.
- **/identity** for self profile, directory search, relationship toggles, and listing joined servers.
- **/structure** for server/channel creation, invite lifecycle, and role definitions.
- **/messaging** for message CRUD-like operations, reactions, and typing signals.
- **/media** for upload intents, completion callbacks, and media policy limits.
- **/search** for scoped message lookup with channel/user context.
- **/moderation** for report intake and enforcement actions.
- **/realtime** for ICE discovery and advertised WebSocket/WebRTC capabilities used by the WebSocket gateway and media pipeline.
- **/graphql** for typed aggregation of servers, channels, and message sends (alongside REST).

The gateway fronts public traffic with CORS + Helmet hardening, JSON shape enforcement, rate limits (global and auth-specific),
 and Zod-based schema validation on write paths before routing into the service modules.

A WebSocket endpoint at `/ws` demonstrates the delivery fanout path, broadcasting messages to all connected clients.

The browser prototype no longer injects synthetic "realtime" events; live updates are expected to flow from the backend WebSocket and service hooks instead of client-side timers.

Role-aware endpoints now enforce the platform's permission surface: guests can only browse public servers/channels with limited history previews; registered users can post/react/thread/upload/search where their server roles allow; moderators/admins can manage channels, invites, roles, and apply moderation actions such as report resolutions and message takedowns.

### Running locally
1. Install dependencies: `npm install` (packages declared in `package.json`).
2. Provide a MongoDB connection string via `MONGODB_URI` or default to `mongodb://localhost:27017/interact`.
3. Start the gateway: `npm start` (defaults to port 4000) — startup waits for MongoDB connection and ensures collection validators are applied.
4. Hit `/health` to verify liveness; use Authorization headers (`Bearer <token>`) from `/auth/login` or `/auth/register` for protected routes.
