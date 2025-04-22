const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Server error' });
  }
};

module.exports = auth; 