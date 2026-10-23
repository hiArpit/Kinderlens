const ChildProfile = require('../models/ChildProfile');

const resolveChildProfile = async (req, res, next) => {
  const requestedId = typeof req.body?.child_profile_id === 'string'
    ? req.body.child_profile_id
    : null;

  if (!requestedId) return next();
  if (!req.parentId) {
    return res.status(403).json({
      error: 'ACCOUNT_REQUIRED',
      message: 'Sign in with a parent account before selecting a child profile.',
    });
  }

  try {
    const profile = await ChildProfile.findOne({
      _id: requestedId,
      parentId: req.parentId,
    }).lean();
    if (!profile) {
      return res.status(403).json({
        error: 'CHILD_PROFILE_FORBIDDEN',
        message: 'That child profile is not available for this account.',
      });
    }
    req.childProfileId = profile._id;
    return next();
  } catch (error) {
    return res.status(400).json({
      error: 'INVALID_CHILD_PROFILE',
      message: 'The selected child profile is not valid.',
    });
  }
};

module.exports = { resolveChildProfile };
