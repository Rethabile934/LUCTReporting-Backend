const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  const { reportId, rating } = req.body;

  if (!reportId || !rating) {
    return res.status(400).json({ error: 'reportId and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const existing = await db.collection('ratings')
      .where('reportId', '==', reportId)
      .where('studentId', '==', req.user.uid)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ error: 'You have already rated this report' });
    }

    const ref = await db.collection('ratings').add({
      reportId,
      rating,
      studentId: req.user.uid,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Rating submitted', ratingId: ref.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('ratings').get();
    const ratings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/report/:reportId', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('ratings')
      .where('reportId', '==', req.params.reportId)
      .get();

    const ratings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const avg = ratings.length > 0
      ? ratings.reduce((a, r) => a + r.rating, 0) / ratings.length
      : 0;

    res.json({ ratings, average: avg.toFixed(1), count: ratings.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;