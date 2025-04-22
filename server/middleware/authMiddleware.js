const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // 从 cookie 中获取 token
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录'
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录'
    });
  }
};

module.exports = authMiddleware; 