const express = require('express');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const { mockIceServers } = require('../utils/realtime');
const router = express.Router();

router.use(optionalAuthenticate);

router.get('/ice', (req, res) => {
  res.json({
    transport: 'webrtc',
    servers: mockIceServers(),
  });
});

router.get('/capabilities', (req, res) => {
  res.json({
    websocket: { path: '/ws', protocols: ['json'] },
    webrtc: { supported: true, transport: 'sfu', ice: mockIceServers() },
  });
});

module.exports = router;
