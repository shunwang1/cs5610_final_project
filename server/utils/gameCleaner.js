const Game = require('../models/Game');

/**
 * 自动关闭无人加入的游戏
 * - 检查所有状态为"open"且创建时间超过3分钟的游戏
 * - 将这些游戏状态更改为"cancelled"
 */
const cleanupAbandonedGames = async () => {
  try {
    // 计算3分钟前的时间戳
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    // 查找所有状态为'open'且创建时间超过3分钟的游戏
    const result = await Game.updateMany(
      { 
        state: 'open', 
        startTime: { $lt: threeMinutesAgo } 
      },
      { 
        $set: { 
          state: 'closed',
          endTime: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`已关闭 ${result.modifiedCount} 个无人加入的游戏`);
    }
  } catch (error) {
    console.error('清理无人加入游戏失败:', error);
  }
};

/**
 * 启动定时清理任务
 * @param {number} intervalMinutes 清理间隔（分钟）
 */
const startGameCleanupScheduler = (intervalMinutes = 1) => {
  // 立即执行一次
  cleanupAbandonedGames();
  
  // 设置定时任务，默认每分钟执行一次
  const interval = setInterval(cleanupAbandonedGames, intervalMinutes * 60 * 1000);
  
  return interval;
};

module.exports = {
  cleanupAbandonedGames,
  startGameCleanupScheduler
}; 