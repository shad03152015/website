const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { WebSocketServer } = require('ws');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ApolloServer, gql } = require('apollo-server-express');
const auth = require('./services/auth');
const identity = require('./services/identity');
const serverChannel = require('./services/serverChannel');
const messaging = require('./services/messaging');
const media = require('./services/media');
const search = require('./services/search');
const moderation = require('./services/moderation');
const realtime = require('./services/realtime');
const requestShape = require('./middleware/requestShape');
const { connectToDatabase } = require('./data/database');
const { addMessage, servers, channels } = require('./data/mockData');

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(requestShape);
app.use(morgan('dev'));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', detail: 'Too many auth attempts, slow down.' },
});

app.use(globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authLimiter, auth);
app.use('/identity', identity);
app.use('/directory', identity);
app.use('/structure', serverChannel);
app.use('/messaging', messaging);
app.use('/media', media);
app.use('/search', search);
app.use('/moderation', moderation);
app.use('/realtime', realtime);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Fallback error handler for unexpected server errors
  /* eslint-disable no-console */
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'internal_error' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const typeDefs = gql`
  type Server {
    id: ID!
    name: String!
    description: String
    iconUrl: String
    defaultRoleId: String
    isPublic: Boolean
    channels: [Channel!]!
  }

  type Channel {
    id: ID!
    serverId: ID!
    type: String!
    name: String!
    topic: String
    rateLimit: Int
    isPublic: Boolean
  }

  type Message {
    id: ID!
    channelId: ID!
    authorId: ID!
    content: String!
    createdAt: String!
  }

  type Query {
    servers(publicOnly: Boolean): [Server!]!
    channels(serverId: ID!): [Channel!]!
  }

  type Mutation {
    sendMessage(channelId: ID!, authorId: ID!, content: String!): Message!
  }
`;

const resolvers = {
  Query: {
    servers: (_, { publicOnly }) => (publicOnly ? servers.filter((s) => s.isPublic) : servers),
    channels: (_, { serverId }) => channels.filter((c) => c.serverId === serverId),
  },
  Server: {
    channels: (parent) => channels.filter((c) => c.serverId === parent.id),
  },
  Mutation: {
    sendMessage: (_, { channelId, authorId, content }) => addMessage(channelId, authorId, content),
  },
};

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'welcome', message: 'Connected to Interact gateway' }));
  socket.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
      }
      if (parsed.type === 'message') {
        const message = addMessage(parsed.channelId, parsed.authorId || 'u-1', parsed.content || '');
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'message', data: message }));
          }
        });
      }
    } catch (err) {
      socket.send(JSON.stringify({ type: 'error', error: 'invalid payload' }));
    }
  });
});

const port = process.env.PORT || 4000;

async function startGateway() {
  await connectToDatabase();
  const apollo = new ApolloServer({ typeDefs, resolvers, context: ({ req }) => ({ userId: req.userId || null }) });
  await apollo.start();
  apollo.applyMiddleware({ app, path: '/graphql' });

  server.listen(port, () => {
    /* eslint-disable no-console */
    console.log(`API Gateway listening on :${port}`);
  });
}

startGateway().catch((err) => {
  /* eslint-disable no-console */
  console.error('Failed to start gateway', err);
  process.exit(1);
});
