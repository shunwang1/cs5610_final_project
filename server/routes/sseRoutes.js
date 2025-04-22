const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { initSSE, subscribeToGame } = require('../utils/sse');

const router = express.Router();

// CORS中间件，专门为SSE设置
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cache-Control', 'no-cache');
  res.header('Connection', 'keep-alive');
  next();
});

// SSE连接端点
router.get('/connect', (req, res) => {
  const clientId = uuidv4();
  console.log(`新的SSE客户端连接: ${clientId}`);
  
  // 初始化SSE连接
  initSSE(req, res, clientId);
});

// 订阅特定游戏
router.get('/subscribe/:gameId', (req, res) => {
  const { gameId } = req.params;
  const clientId = req.query.clientId;
  
  if (!clientId) {
    return res.status(400).json({ message: '缺少客户端ID' });
  }
  
  // 注册游戏订阅
  subscribeToGame(clientId, gameId);
  res.json({ success: true, message: `已订阅游戏 ${gameId}` });
});

module.exports = router; 