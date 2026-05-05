const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/', authMiddleware, async (req, res) => {
  try {
    const snap = await db.collection('courses').get();
    const courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/', authMiddleware, async (req, res) => {
  const { courseName, courseCode, facultyName, assignedTo } = req.body;

  if (!courseName || !courseCode) {
    return res.status(400).json({ error: 'Course name and code are required' });
  }

  try {
    const ref = await db.collection('courses').add({
      courseName,
      courseCode,
      facultyName,
      assignedTo,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ message: 'Course created successfully', courseId: ref.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const courseRef = db.collection('courses').doc(req.params.id);
    const course = await courseRef.get();

    if (!course.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await courseRef.update({
      ...req.body,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const courseRef = db.collection('courses').doc(req.params.id);
    const course = await courseRef.get();

    if (!course.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await courseRef.delete();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;