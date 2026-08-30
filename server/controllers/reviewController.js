const Match = require('../models/Match');
const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const { createNotification } = require('../utils/notify');

const createReview = async (req, res) => {
  try {
    const { comment = '', rating, sessionId } = req.body;
    const parsedRating = Number(rating);

    if (!sessionId || !Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'sessionId and a rating from 1 to 5 are required',
      });
    }

    if (typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'Comment must be a string' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      status: 'completed',
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Completed session not found' });
    }

    const reviewee = session.userA.toString() === req.user._id.toString() ? session.userB : session.userA;
    const existingReview = await Review.findOne({ session: session._id, reviewer: req.user._id });
    if (existingReview) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this session' });
    }

    const review = await Review.create({
      session: session._id,
      reviewer: req.user._id,
      reviewee,
      rating: parsedRating,
      comment: comment.trim(),
    });
    createNotification(reviewee, 'new_review', `${req.user.name} left you a ${parsedRating}-star review`, review._id.toString()).catch((error) => console.error(`Review notification error: ${error.message}`));

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this session' });
    }

    console.error(`Review creation error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to submit review' });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name avatar profileVisibility');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Respect the profile owner's visibility setting.
    const isOwner = req.user && String(req.user._id) === String(user._id);
    if (!isOwner && user.profileVisibility === 'connections') {
      const acceptedMatch = await Match.findOne({
        status: 'accepted',
        $or: [
          { userA: req.user?._id, userB: user._id },
          { userA: user._id, userB: req.user?._id },
        ],
      });
      if (!acceptedMatch) {
        return res.status(403).json({ success: false, message: 'This profile is private' });
      }
    }

    const reviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length ? Number((total / reviews.length).toFixed(1)) : 0;

    return res.json({
      success: true,
      message: 'User reviews retrieved',
      data: {
        user,
        averageRating,
        reviewCount: reviews.length,
        reviews,
      },
    });
  } catch (error) {
    console.error(`Review retrieval error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve user reviews' });
  }
};

module.exports = { createReview, getUserReviews };
