const User = require('../models/User');

// 获取所有玩家的战绩
exports.getScores = async (req, res) => {
  try {
    const users = await User.find({}, 'username wins losses')
      .sort({ 
        wins: -1,  // 胜场降序
        losses: 1, // 负场升序
        username: 1 // 用户名升序
      });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取排行榜失败',
      error: error.message
    });
  }
}; 