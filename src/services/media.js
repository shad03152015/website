const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { z } = require('zod');

const router = express.Router();

router.use(authenticate);

const uploadRequestSchema = z.object({
  body: z.object({
    size: z.number().int().positive(),
    type: z.string().min(1),
  }),
});

router.post('/uploads/request', validate(uploadRequestSchema), (req, res) => {
  const { size, type } = req.validated.body;
  res.json({
    uploadId: uuidv4(),
    presignedUrl: 'https://upload.mock/' + uuidv4(),
    expiresIn: 900,
    virusScan: 'pending',
  });
});

const uploadCompleteSchema = z.object({
  params: z.object({ uploadId: z.string().min(1) }),
});

router.post('/uploads/:uploadId/complete', validate(uploadCompleteSchema), (req, res) => {
  res.json({ status: 'stored', cdnUrl: 'https://cdn.mock/' + req.params.uploadId });
});

router.get('/limits', (req, res) => {
  res.json({ maxSizeMb: 100, allowedTypes: ['image/png', 'image/jpeg', 'video/mp4'] });
});

module.exports = router;
