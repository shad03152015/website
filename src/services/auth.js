const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { users, sessions } = require('../data/mockData');
const validate = require('../middleware/validate');
const { z } = require('zod');

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().min(1).optional(),
  }),
});

router.post('/register', validate(registerSchema), (req, res) => {
  const { email, password, displayName } = req.validated.body;
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ error: 'user exists' });
  }
  const user = {
    id: uuidv4(),
    email,
    password,
    displayName: displayName || email.split('@')[0],
    avatarUrl: '',
    oauthProviders: [],
    settings: {},
    twoFactorEnabled: false,
    lastSeenAt: new Date().toISOString(),
  };
  users.push(user);
  const token = uuidv4();
  sessions.set(token, { userId: user.id, createdAt: new Date().toISOString(), factorsPassed: ['password'] });
  res.status(201).json({ user, token });
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

router.post('/login', validate(loginSchema), (req, res) => {
  const { email, password } = req.validated.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = uuidv4();
  sessions.set(token, { userId: user.id, createdAt: new Date().toISOString(), factorsPassed: ['password'] });
  res.json({ token, user });
});

const oauthSchema = z.object({
  body: z.object({
    provider: z.string().min(1),
    email: z.string().email(),
  }),
});

router.post('/oauth/callback', validate(oauthSchema), (req, res) => {
  const { provider, email } = req.validated.body;
  let user = users.find((u) => u.email === email);
  if (!user) {
    user = {
      id: uuidv4(),
      email,
      password: null,
      displayName: email.split('@')[0],
      avatarUrl: '',
      oauthProviders: [provider],
      settings: {},
      twoFactorEnabled: false,
      lastSeenAt: new Date().toISOString(),
    };
    users.push(user);
  }
  if (!user.oauthProviders.includes(provider)) {
    user.oauthProviders.push(provider);
  }
  const token = uuidv4();
  sessions.set(token, { userId: user.id, createdAt: new Date().toISOString(), factorsPassed: ['oauth:' + provider] });
  res.json({ token, user });
});

const refreshSchema = z.object({
  body: z.object({ token: z.string().uuid() }),
});

router.post('/refresh', validate(refreshSchema), (req, res) => {
  const { token } = req.validated.body;
  if (!sessions.has(token)) {
    return res.status(401).json({ error: 'invalid session' });
  }
  const session = sessions.get(token);
  const nextToken = uuidv4();
  sessions.delete(token);
  sessions.set(nextToken, { ...session, refreshedAt: new Date().toISOString() });
  res.json({ token: nextToken });
});

router.get('/sessions', (req, res) => {
  const values = Array.from(sessions.entries()).map(([key, value]) => ({ token: key, ...value }));
  res.json(values);
});

module.exports = router;
