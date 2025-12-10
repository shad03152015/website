function mockIceServers() {
  return [
    { urls: ['stun:stun1.interact.example.com:3478', 'stun:stun2.interact.example.com:3478'] },
    {
      urls: ['turn:turn.interact.example.com:3478?transport=udp', 'turn:turn.interact.example.com:3478?transport=tcp'],
      username: 'demo-user',
      credential: 'demo-credential',
    },
  ];
}

module.exports = { mockIceServers };
