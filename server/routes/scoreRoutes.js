const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');

// 获取排行榜
router.get('/', scoreController.getScores);

module.exports = router; 