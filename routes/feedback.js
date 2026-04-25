const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/', authMiddleware, async (req, res) => {
  const { reportId, comment } = req.body;

  if (req.user.role !== 'prl' && req.user.role !== 'pl') {
    return res.status(403).json({ error: 'Only PRL or PL can submit feedback' });
  }

  if (!reportId || !comment) {
    return res.status(400).json({ error: 'reportId and comment are required' });
  }

  try {
    const ref = await db.collection('feedback').add({
      reportId,
      comment,
      prlId: req.user.uid,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Feedback submitted', feedbackId: ref.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('feedback').get();
    const feedback = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/report/:reportId', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('feedback')
      .where('reportId', '==', req.params.reportId)
      .get();

    const feedback = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;