const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({ 
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  state: {
    type: String,
    enum: ['open', 'active', 'completed', 'closed'],
    default: 'open'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  board1: {
    ships: [
      {
        id: String,
        size: Number,
        positions: [
          {
            row: Number,
            col: Number,
            hit: { type: Boolean, default: false }
          }
        ]
      }
    ],
    shots: [
      {
        row: Number,
        col: Number,
        hit: Boolean
      }
    ]
  },
  board2: {
    ships: [
      {
        id: String,
        size: Number,
        positions: [
          {
            row: Number,
            col: Number,
            hit: { type: Boolean, default: false }
          }
        ]
      }
    ],
    shots: [
      {
        row: Number,
        col: Number,
        hit: Boolean
      }
    ]
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMoveHit: Boolean
}, { timestamps: true });

// 船只数据生成函数
gameSchema.statics.generateShips = function() {
  const ships = [
    { id: 'carrier', size: 5 },
    { id: 'battleship', size: 4 },
    { id: 'cruiser', size: 3 },
    { id: 'submarine', size: 3 },
    { id: 'destroyer', size: 2 }
  ];

  // 棋盘大小
  const boardSize = 10;
  
  // 放置的船只数组
  const placedShips = [];
  
  // 记录已占用的位置
  const occupiedPositions = new Set();
  
  // 循环放置每艘船
  for (const ship of ships) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环
    
    while (!placed && attempts < maxAttempts) {
      attempts++;
      
      // 随机选择方向: true为水平, false为垂直
      const isHorizontal = Math.random() > 0.5;
      
      // 计算可能的起始位置范围
      const maxRow = isHorizontal ? boardSize - 1 : boardSize - ship.size;
      const maxCol = isHorizontal ? boardSize - ship.size : boardSize - 1;
      
      // 随机选择起始位置
      const startRow = Math.floor(Math.random() * (maxRow + 1));
      const startCol = Math.floor(Math.random() * (maxCol + 1));
      
      // 检查位置是否可用
      let canPlace = true;
      const positions = [];
      
      for (let i = 0; i < ship.size; i++) {
        const row = isHorizontal ? startRow : startRow + i;
        const col = isHorizontal ? startCol + i : startCol;
        const posKey = `${row},${col}`;
        
        // 如果位置已被占用，则不能放置
        if (occupiedPositions.has(posKey)) {
          canPlace = false;
          break;
        }
        
        positions.push({ row, col, hit: false });
      }
      
      // 如果可以放置，记录并标记已占用的位置
      if (canPlace) {
        placedShips.push({
          id: ship.id,
          size: ship.size,
          positions: positions
        });
        
        for (const pos of positions) {
          occupiedPositions.add(`${pos.row},${pos.col}`);
        }
        
        placed = true;
      }
    }
    
    // 如果无法放置所有船只，返回空数组重新生成
    if (!placed) {
      return this.generateShips(); // 递归重试
    }
  }
  
  return placedShips;
};

// 清理过期游戏的静态方法
gameSchema.statics.cleanupExpiredGames = async function() {
  try {
    // 计算过期时间（当前时间减去3分钟）
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() - 3);
    
    console.log(`清理过期游戏 - 过期时间: ${expiryTime.toISOString()}, 服务器当前时间: ${new Date().toISOString()}`);
    
    // 查找所有过期的开放游戏（创建时间超过3分钟且无第二位玩家）
    const expiredGames = await this.find({
      state: 'open',
      createdAt: { $lt: expiryTime },
      player2: { $exists: false }
    });
    
    console.log(`找到 ${expiredGames.length} 个过期游戏需要关闭`);
    
    if (expiredGames.length > 0) {
      // 批量更新所有过期游戏为关闭状态
      const result = await this.updateMany(
        {
          _id: { $in: expiredGames.map(game => game._id) }
        },
        {
          $set: { 
            state: 'closed',
            lastUpdate: new Date()
          }
        }
      );
      
      console.log(`成功关闭 ${result.modifiedCount} 个过期游戏`);
      return result.modifiedCount;
    }
    
    return 0; // 如果没有过期游戏，返回0
  } catch (error) {
    console.error('清理过期游戏时出错:', error);
    throw error; // 抛出错误以便调用者处理
  }
};

// 添加索引以提高查询性能
gameSchema.index({ state: 1 });
gameSchema.index({ player1: 1 });
gameSchema.index({ player2: 1 });

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
