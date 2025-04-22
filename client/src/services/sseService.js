import api from './api';

let eventSource = null;
let clientId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000; // 3秒

const eventListeners = new Map();

/**
 * 初始化SSE连接
 * @returns {Promise<string>} 返回客户端ID
 */
export const initSSE = () => {
  return new Promise((resolve, reject) => {
    if (eventSource) {
      eventSource.close();
    }

    // 创建新的EventSource连接
    const url = `${api.defaults.baseURL}/api/sse/connect`;
    
    // withCredentials 需要设置为true以便发送cookies
    const options = { 
      withCredentials: true 
    };
    
    try {
      eventSource = new EventSource(url, options);
      
      // 连接成功事件
      eventSource.onopen = () => {
        console.log('SSE连接已建立');
        reconnectAttempts = 0;
      };
      
      // 接收消息事件
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE接收到消息:', data);
          
          // 如果是初始连接消息，保存客户端ID
          if (data.event === 'connected') {
            clientId = data.clientId;
            resolve(clientId);
          }
          
          // 触发自定义事件
          if (data.event && data.gameId && eventListeners.has(data.gameId)) {
            const listeners = eventListeners.get(data.gameId);
            listeners.forEach(callback => callback(data));
          }
        } catch (error) {
          console.error('SSE消息解析错误:', error);
        }
      };
      
      // 错误处理
      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        eventSource.close();
        
        // 尝试重新连接
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`SSE尝试重新连接 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          setTimeout(() => initSSE().then(resolve).catch(reject), RECONNECT_INTERVAL);
        } else {
          console.error('SSE连接失败，已达到最大重试次数');
          reject(new Error('SSE连接失败'));
        }
      };
    } catch (err) {
      console.error('创建EventSource失败:', err);
      reject(err);
    }
  });
};

/**
 * 订阅特定游戏的更新
 * @param {string} gameId - 游戏ID
 * @returns {Promise<boolean>} 是否成功订阅
 */
export const subscribeToGame = async (gameId) => {
  if (!clientId) {
    try {
      await initSSE();
    } catch (error) {
      console.error('无法初始化SSE连接:', error);
      return false;
    }
  }
  
  try {
    await api.get(`/api/sse/subscribe/${gameId}?clientId=${clientId}`);
    console.log(`已成功订阅游戏 ${gameId}`);
    return true;
  } catch (error) {
    console.error('订阅游戏失败:', error);
    return false;
  }
};

/**
 * 添加游戏事件监听器
 * @param {string} gameId - 游戏ID
 * @param {Function} callback - 接收事件的回调函数
 */
export const addGameEventListener = (gameId, callback) => {
  if (!eventListeners.has(gameId)) {
    eventListeners.set(gameId, new Set());
  }
  eventListeners.get(gameId).add(callback);
};

/**
 * 移除游戏事件监听器
 * @param {string} gameId - 游戏ID
 * @param {Function} callback - 要移除的回调函数
 */
export const removeGameEventListener = (gameId, callback) => {
  if (eventListeners.has(gameId)) {
    const listeners = eventListeners.get(gameId);
    listeners.delete(callback);
    
    if (listeners.size === 0) {
      eventListeners.delete(gameId);
    }
  }
};

/**
 * 关闭SSE连接
 */
export const closeSSE = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  clientId = null;
  eventListeners.clear();
};

export default {
  initSSE,
  subscribeToGame,
  addGameEventListener,
  removeGameEventListener,
  closeSSE
}; 