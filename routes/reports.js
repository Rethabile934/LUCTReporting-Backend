const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  const {
    facultyName, className, weekOfReporting, dateOfLecture,
    courseName, courseCode, lecturerName, actualStudentsPresent,
    totalRegisteredStudents, venue, scheduledTime,
    topicTaught, learningOutcomes, recommendations
  } = req.body;

  if (!facultyName || !className || !courseName || !courseCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const reportRef = await db.collection('reports').add({
      facultyName, className, weekOfReporting, dateOfLecture,
      courseName, courseCode, lecturerName, actualStudentsPresent,
      totalRegisteredStudents, venue, scheduledTime,
      topicTaught, learningOutcomes, recommendations,
      submittedBy: req.user.uid,
      submittedAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      reportId: reportRef.id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('reports')
      .orderBy('submittedAt', 'desc')
      .get();

    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('reports')
      .where('submittedBy', '==', req.user.uid)
      .get();

    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await db.collection('reports').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.collection('reports').doc(req.params.id).delete();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;