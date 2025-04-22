const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/auth');

// 获取所有游戏
router.get('/', gameController.getAllGames);

// 创建新游戏
router.post('/', auth, gameController.createGame);

// 获取单个游戏
router.get('/:gameId', gameController.getGame);

// 加入游戏
router.post('/:gameId/join', auth, gameController.joinGame);

// 进行游戏操作
router.post('/:gameId/move', auth, gameController.makeMove);

// 开发环境：重置游戏数据（仅限开发测试使用）
if (process.env.NODE_ENV === 'development') {
  router.post('/reset-dev-data', async (req, res) => {
    try {
      const Game = require('../models/Game');
      const result = await Game.deleteMany({});
      console.log(`开发环境：已重置游戏数据，删除了 ${result.deletedCount} 条记录`);
      res.json({ success: true, message: `已重置游戏数据，删除了 ${result.deletedCount} 条记录` });
    } catch (error) {
      console.error('重置游戏数据失败:', error);
      res.status(500).json({ success: false, message: '重置游戏数据失败' });
    }
  });
}

module.exports = router; 