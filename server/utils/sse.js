/**
 * SSE (Server-Sent Events) 实现
 * 用于实时推送游戏状态更新
 */

// 存储所有的SSE客户端连接
const clients = new Map();
// 存储游戏订阅关系 - 每个游戏ID对应哪些客户端
const gameSubscriptions = new Map();

/**
 * 设置SSE请求头和初始化连接
 * @param {Request} req - Express请求对象 
 * @param {Response} res - Express响应对象
 * @param {string} clientId - 客户端ID
 */
const initSSE = (req, res, clientId) => {
  console.log(`初始化SSE连接: ${clientId}`);
  
  // 设置SSE相关的HTTP头
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // 禁用Nginx缓冲
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true'
  };

  // 设置响应头
  res.writeHead(200, headers);

  // 发送首次连接确认
  res.write(`data: ${JSON.stringify({ event: 'connected', clientId, message: '已连接到服务器SSE' })}\n\n`);

  // 存储客户端连接
  clients.set(clientId, res);

  // 定期发送保持连接的消息
  const keepAliveInterval = setInterval(() => {
    if (clients.has(clientId)) {
      res.write(`: keep-alive ${new Date().toISOString()}\n\n`);
    } else {
      clearInterval(keepAliveInterval);
    }
  }, 30000); // 每30秒发送一次
  
  // 监听连接关闭
  req.on('close', () => {
    console.log(`SSE客户端断开连接: ${clientId}`);
    clients.delete(clientId);
    clearInterval(keepAliveInterval);
    
    // 清理游戏订阅
    for (const [gameId, subscribers] of gameSubscriptions.entries()) {
      if (subscribers.has(clientId)) {
        subscribers.delete(clientId);
        // 如果游戏没有订阅者了，清除该游戏的记录
        if (subscribers.size === 0) {
          gameSubscriptions.delete(gameId);
        }
      }
    }
  });
};

/**
 * 客户端订阅特定游戏的更新
 * @param {string} clientId - 客户端ID
 * @param {string} gameId - 游戏ID
 */
const subscribeToGame = (clientId, gameId) => {
  if (!clients.has(clientId)) {
    console.warn(`尝试为不存在的客户端 ${clientId} 订阅游戏`);
    return false;
  }
  
  if (!gameSubscriptions.has(gameId)) {
    gameSubscriptions.set(gameId, new Set());
  }
  
  gameSubscriptions.get(gameId).add(clientId);
  console.log(`客户端 ${clientId} 已订阅游戏 ${gameId}`);
  
  // 向客户端发送订阅确认
  const res = clients.get(clientId);
  if (res) {
    res.write(`data: ${JSON.stringify({ 
      event: 'subscribed', 
      gameId,
      message: `已订阅游戏 ${gameId}` 
    })}\n\n`);
  }
  
  return true;
};

/**
 * 向特定游戏的所有订阅者发送更新
 * @param {string} gameId - 游戏ID
 * @param {string} eventType - 事件类型
 * @param {object} data - 要发送的数据
 */
const notifyGameChange = (gameId, eventType, data = {}) => {
  console.log(`发送游戏更新通知: gameId=${gameId}, event=${eventType}`);
  
  if (!gameSubscriptions.has(gameId)) {
    console.log(`没有客户端订阅游戏 ${gameId}`);
    return;
  }
  
  const subscribers = gameSubscriptions.get(gameId);
  const message = JSON.stringify({
    gameId,
    event: eventType,
    ...data,
    timestamp: new Date().toISOString()
  });
  
  let notifiedCount = 0;
  
  for (const clientId of subscribers) {
    const client = clients.get(clientId);
    if (client) {
      client.write(`data: ${message}\n\n`);
      notifiedCount++;
    }
  }
  
  console.log(`已将游戏 ${gameId} 的更新通知发送给 ${notifiedCount} 个客户端`);
};

module.exports = {
  initSSE,
  subscribeToGame,
  notifyGameChange,
  clients,
  gameSubscriptions
}; 