const updateProfile = async (req, res) => {
  try {
    const { avatar, bio, name, skillsOffered, skillsWanted } = req.body;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ success: false, message: 'Name must be a non-empty string' });
    }

    if (avatar !== undefined && typeof avatar !== 'string') {
      return res.status(400).json({ success: false, message: 'Avatar must be a string URL' });
    }

    if (skillsOffered !== undefined && !Array.isArray(skillsOffered)) {
      return res.status(400).json({
        success: false,
        message: 'skillsOffered must be an array',
      });
    }

    if (skillsWanted !== undefined && !Array.isArray(skillsWanted)) {
      return res.status(400).json({
        success: false,
        message: 'skillsWanted must be an array',
      });
    }

    if (bio !== undefined && typeof bio !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Bio must be a string',
      });
    }

    if (name !== undefined) req.user.name = name.trim();
    if (avatar !== undefined) req.user.avatar = avatar.trim();
    if (skillsOffered !== undefined) req.user.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) req.user.skillsWanted = skillsWanted;
    if (bio !== undefined) req.user.bio = bio.trim();

    await req.user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: req.user },
    });
  } catch (error) {
    console.error(`Profile update error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Unable to update profile',
    });
  }
};

module.exports = { updateProfile };
