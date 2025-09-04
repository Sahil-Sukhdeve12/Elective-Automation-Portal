const express = require('express');
const Elective = require('../models/Elective');
const StudentElective = require('../models/StudentElective');
const ElectiveFeedback = require('../models/ElectiveFeedback');
const { auth, isAdmin, isStudent } = require('../middleware/auth');

const router = express.Router();

// Get all electives (public)
router.get('/', async (req, res) => {
  try {
    const { category, department, semester, domain } = req.query;
    
    let filter = { isActive: true };
    
    if (category) filter.electiveCategory = category;
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (domain) filter.domain = domain;

    const electives = await Elective.find(filter)
      .populate('prerequisites', 'name code')
      .populate('futureOptions', 'name code semester')
      .sort({ semester: 1, name: 1 });

    res.json(electives);
  } catch (error) {
    console.error('Get electives error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get elective by ID
router.get('/:id', async (req, res) => {
  try {
    const elective = await Elective.findById(req.params.id)
      .populate('prerequisites', 'name code')
      .populate('futureOptions', 'name code semester')
      .populate('createdBy', 'name email');

    if (!elective) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    res.json(elective);
  } catch (error) {
    console.error('Get elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new elective (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const electiveData = {
      ...req.body,
      createdBy: req.user.id
    };

    const elective = new Elective(electiveData);
    await elective.save();

    const populatedElective = await Elective.findById(elective._id)
      .populate('prerequisites', 'name code')
      .populate('futureOptions', 'name code semester');

    res.status(201).json({
      message: 'Elective created successfully',
      elective: populatedElective
    });
  } catch (error) {
    console.error('Create elective error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Elective code already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Update elective (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const elective = await Elective.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('prerequisites', 'name code')
     .populate('futureOptions', 'name code semester');

    if (!elective) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    res.json({
      message: 'Elective updated successfully',
      elective
    });
  } catch (error) {
    console.error('Update elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete elective (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const elective = await Elective.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!elective) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    res.json({ message: 'Elective deleted successfully' });
  } catch (error) {
    console.error('Delete elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Select elective (student only)
router.post('/:id/select', auth, isStudent, async (req, res) => {
  try {
    const electiveId = req.params.id;
    const { semester } = req.body;

    // Check if elective exists and is active
    const elective = await Elective.findById(electiveId);
    if (!elective || !elective.isActive) {
      return res.status(404).json({ message: 'Elective not found' });
    }

    // Check deadline
    if (elective.selectionDeadline && new Date() > elective.selectionDeadline) {
      return res.status(400).json({ message: 'Selection deadline has passed' });
    }

    // Check if student already selected this elective
    const existingSelection = await StudentElective.findOne({
      student: req.user.id,
      elective: electiveId
    });

    if (existingSelection) {
      return res.status(400).json({ message: 'You have already selected this elective' });
    }

    // Check if student already selected an elective for this semester
    const semesterSelection = await StudentElective.findOne({
      student: req.user.id,
      semester: semester || req.user.semester
    });

    if (semesterSelection) {
      return res.status(400).json({ message: 'You have already selected an elective for this semester' });
    }

    // Check prerequisites
    if (elective.prerequisites && elective.prerequisites.length > 0) {
      const completedElectives = await StudentElective.find({
        student: req.user.id,
        status: 'completed'
      }).select('elective');

      const completedIds = completedElectives.map(se => se.elective.toString());
      const prerequisiteIds = elective.prerequisites.map(p => p.toString());
      
      const hasAllPrerequisites = prerequisiteIds.every(prereq => 
        completedIds.includes(prereq)
      );

      if (!hasAllPrerequisites) {
        return res.status(400).json({ message: 'You do not meet the prerequisites for this elective' });
      }
    }

    // Create selection
    const studentElective = new StudentElective({
      student: req.user.id,
      elective: electiveId,
      semester: semester || req.user.semester,
      domain: elective.domain
    });

    await studentElective.save();

    res.status(201).json({
      message: 'Elective selected successfully',
      selection: studentElective
    });
  } catch (error) {
    console.error('Select elective error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student's electives
router.get('/student/my-electives', auth, isStudent, async (req, res) => {
  try {
    const studentElectives = await StudentElective.find({ student: req.user.id })
      .populate('elective', 'name code semester domain description credits category electiveCategory')
      .sort({ semester: 1, selectedAt: 1 });

    res.json(studentElectives);
  } catch (error) {
    console.error('Get student electives error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit elective feedback
router.post('/feedback', auth, isStudent, async (req, res) => {
  try {
    const { previousElectiveId, semester, feedback } = req.body;

    // Check if feedback already exists
    const existingFeedback = await ElectiveFeedback.findOne({
      student: req.user.id,
      previousElective: previousElectiveId
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this elective' });
    }

    const electiveFeedback = new ElectiveFeedback({
      student: req.user.id,
      previousElective: previousElectiveId,
      semester,
      feedback
    });

    await electiveFeedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: electiveFeedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get elective recommendations
router.post('/recommendations', auth, isStudent, async (req, res) => {
  try {
    const { interests, careerGoals, difficulty } = req.body;
    
    // Get completed electives
    const completedElectives = await StudentElective.find({
      student: req.user.id,
      status: { $in: ['completed', 'selected'] }
    }).select('elective');

    const completedIds = completedElectives.map(se => se.elective.toString());

    // Get available electives
    const availableElectives = await Elective.find({
      _id: { $nin: completedIds },
      isActive: true,
      semester: { $gte: req.user.semester }
    });

    // Score and sort electives
    const scoredElectives = availableElectives.map(elective => {
      let score = 0;
      
      // Interest matching
      if (interests.includes(elective.domain)) score += 3;
      
      // Career goal matching
      if (elective.description.toLowerCase().includes(careerGoals.toLowerCase())) score += 2;
      
      // Difficulty preference
      if (difficulty === 'easy' && elective.category === 'Theory') score += 1;
      if (difficulty === 'challenging' && elective.category === 'Practical') score += 1;
      
      return { ...elective.toObject(), score };
    });

    // Sort by score and return top 5
    const recommendations = scoredElectives
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
