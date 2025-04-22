const Game = require('../models/Game');
const User = require('../models/User');
const { notifyGameChange } = require('../utils/sse');

// 创建新游戏
exports.createGame = async (req, res) => {
  try {
    const userId = req.user._id;
    const username = req.user.username;
    console.log(`用户 ${username} 正在创建新游戏，当前服务器时间: ${new Date().toISOString()}`);

    // 为player1生成船只位置
    const ships = Game.generateShips();
    
    // 创建新游戏，玩家1为当前用户
    const newGame = new Game({
      player1: userId,
      state: 'open',
      board1: {
        ships: ships,
        shots: []
      }
      // startTime和timestamps会自动添加
    });

    // 保存游戏到数据库
    await newGame.save();
    console.log(`游戏 ${newGame._id} 创建成功，状态: ${newGame.state}, 创建时间: ${newGame.createdAt.toISOString()}`);

    // 设置3分钟后自动关闭未加入的游戏
    setTimeout(async () => {
      try {
        // 重新从数据库获取游戏，以获取最新状态
        const gameAfterTimeout = await Game.findById(newGame._id);
        
        console.log(`检查游戏 ${newGame._id} 是否需要自动关闭, 当前状态: ${gameAfterTimeout?.state}, 当前服务器时间: ${new Date().toISOString()}`);
        
        // 如果游戏仍然是开放状态且没有第二个玩家加入，则关闭游戏
        if (gameAfterTimeout && gameAfterTimeout.state === 'open' && !gameAfterTimeout.player2) {
          gameAfterTimeout.state = 'closed';
          gameAfterTimeout.endTime = new Date();
          await gameAfterTimeout.save();
          console.log(`游戏 ${newGame._id} 已自动关闭 (3分钟超时)`);
          
          // 发送SSE通知客户端
          notifyGameChange({ gameId: newGame._id.toString(), action: 'closed' });
        }
      } catch (error) {
        console.error(`自动关闭游戏 ${newGame._id} 时出错:`, error);
      }
    }, 3 * 60 * 1000); // 3分钟

    res.status(201).json({
      success: true,
      message: '游戏创建成功',
      gameId: newGame._id
    });
  } catch (error) {
    console.error('创建游戏时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，创建游戏失败'
    });
  }
};

// 获取所有游戏
exports.getAllGames = async (req, res) => {
  try {
    const { userId } = req.session;
    const games = await Game.find()
      .populate('player1', 'username')
      .populate('player2', 'username')
      .populate('winner', 'username')
      .sort({ startTime: -1 });

    // 初始化结果对象
    const result = {
      openGames: [],
      activeGames: [],
      completedGames: []
    };

    games.forEach(game => {
      const gameData = {
        _id: game._id,
        player1: game.player1,
        player2: game.player2,
        state: game.state,
        startTime: game.startTime,
        endTime: game.endTime,
        winner: game.winner
      };

      if (game.state === 'open') {
        // 不再区分当前用户创建的开放游戏，所有开放游戏都放入openGames
        result.openGames.push(gameData);
      } else if (game.state === 'active') {
        result.activeGames.push(gameData);
      } else if (game.state === 'completed') {
        result.completedGames.push(gameData);
      }
    });

    // 统一返回格式
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: '获取游戏列表失败', 
      error: error.message 
    });
  }
};

// 获取单个游戏
exports.getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId } = req.session;

    const game = await Game.findById(gameId)
      .populate('player1', 'username _id')
      .populate('player2', 'username _id')
      .populate('currentTurn', 'username _id')
      .populate('winner', 'username _id');

    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }
    
    // 记录当前游戏状态
    console.log('获取游戏信息:', {
      gameId,
      state: game.state,
      player1: game.player1 ? `${game.player1.username} (${game.player1._id})` : 'null',
      player2: game.player2 ? `${game.player2.username} (${game.player2._id})` : 'null',
      currentTurn: game.currentTurn ? `${game.currentTurn.username} (${game.currentTurn._id})` : 'null'
    });

    // 如果用户未登录，只返回基本信息
    if (!userId) {
      return res.json({
        _id: game._id,
        player1: game.player1,
        player2: game.player2,
        state: game.state,
        startTime: game.startTime,
        endTime: game.endTime,
        winner: game.winner
      });
    }

    // 如果用户已登录，返回完整信息
    res.json(game);
  } catch (error) {
    console.error('获取游戏信息失败:', error);
    res.status(500).json({ message: '获取游戏信息失败', error: error.message });
  }
};

// 加入游戏
exports.joinGame = async (req, res) => {
  try {
    // 确保用户已登录
    if (!req.user) {
      return res.status(401).json({ message: '您需要登录才能加入游戏' });
    }

    const gameId = req.params.gameId;
    const game = await Game.findById(gameId).populate('player1');

    if (!game) {
      return res.status(404).json({ message: '游戏未找到' });
    }

    // 检查游戏是否开放
    if (game.state !== 'open') {
      return res.status(400).json({ message: '此游戏无法加入' });
    }

    // 检查玩家是否已是创建者
    if (game.player1 && game.player1._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: '您不能加入自己创建的游戏' });
    }

    // 随机生成船只位置
    const board1Ships = Game.generateShips();
    const board2Ships = Game.generateShips();

    // 更新游戏状态
    game.player2 = req.user._id;
    game.state = 'active';
    game.currentTurn = game.player1._id; // 创建者先行
    game.board1 = {
      ships: board1Ships,
      shots: []
    };
    game.board2 = {
      ships: board2Ships,
      shots: []
    };

    await game.save();
    
    // 通知游戏状态变更 - 添加事件类型
    notifyGameChange(gameId, 'playerJoined');

    // 返回填充的游戏信息
    const populatedGame = await Game.findById(gameId)
      .populate('player1')
      .populate('player2')
      .populate('currentTurn')
      .populate('winner');
      
    console.log('玩家加入游戏:', populatedGame);
    
    res.json(populatedGame);
  } catch (error) {
    console.error('加入游戏出错:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 进行游戏操作
exports.makeMove = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { userId } = req.session;
    const { x, y } = req.body;

    if (!userId) {
      return res.status(401).json({ message: '请先登录' });
    }

    let game = await Game.findById(gameId);
          
    if (!game) {
      return res.status(404).json({ message: '游戏不存在' });
    }
    
    // 验证游戏状态和玩家回合
    if (game.state !== 'active') {
      return res.status(400).json({ message: '游戏未开始或已结束' });
    }
    if (!game.currentTurn || game.currentTurn.toString() !== userId) {
      // 尝试填充 currentTurn 用户信息以供调试
      await game.populate('currentTurn', 'username _id');
      return res.status(400).json({ 
        message: '不是你的回合',
        details: { 
          currentTurn: game.currentTurn ? `${game.currentTurn.username} (${game.currentTurn._id})` : '未知',
          yourId: userId
        }
      });
    }

    const isPlayer1 = game.player1.toString() === userId;
    const opponentBoard = isPlayer1 ? game.board2 : game.board1;
    const playerShots = isPlayer1 ? game.board1.shots : game.board2.shots;
    
    // 确保 board 和 shots 存在
    if (!opponentBoard || !opponentBoard.ships) {
        return res.status(500).json({ message: '对手棋盘数据错误' });
    }
    if (!playerShots) {
        return res.status(500).json({ message: '玩家射击记录数据错误' });
    }

    // 检查是否已经射击过这个位置
    const existingShot = playerShots.find(shot => shot.row === x && shot.col === y);
    if (existingShot) {
      return res.status(400).json({ message: '已经射击过这个位置' });
    }

    // 检查射击位置是否有船
    let hit = false;
    let hitShipId = null;
    let allShipsSunk = false;

    opponentBoard.ships.forEach(ship => {
      if (!ship || !ship.positions) return; // 防御性检查
      ship.positions.forEach(pos => {
        if (pos && pos.row === x && pos.col === y && !pos.hit) { // 确保只处理未击中的部分
          pos.hit = true;
          hit = true;
          hitShipId = ship.id;
        }
      });
    });

    // 记录射击
    playerShots.push({ row: x, col: y, hit });
    game.lastMoveHit = hit;

    if (hit) {
      // 检查是否击沉所有船只
      allShipsSunk = opponentBoard.ships.every(ship =>
        ship.positions.every(pos => pos.hit)
      );

      if (allShipsSunk) {
        game.state = 'completed';
        game.winner = userId;
        game.endTime = new Date();

        // 更新玩家战绩 (确保只更新一次)
        try {
          await User.bulkWrite([
            { updateOne: { filter: { _id: userId }, update: { $inc: { wins: 1 } } } },
            { updateOne: { filter: { _id: isPlayer1 ? game.player2 : game.player1 }, update: { $inc: { losses: 1 } } } }
          ]);
        } catch (statError) {
          console.error("更新玩家战绩失败:", statError);
          // 非致命错误，继续执行
        }
        
        // 由于游戏结束，下一回合设为 null
        game.currentTurn = null;
      } else {
        // 击中但未结束游戏，不切换回合
        // currentTurn 保持不变
      }
    } else {
      // 未击中，切换回合
      game.currentTurn = isPlayer1 ? game.player2 : game.player1;
    }

    // 标记 board1 或 board2 为已修改，确保 Mongoose 保存更改
    if (isPlayer1) {
      game.markModified('board2'); // 对手棋盘被修改（船只状态）
      game.markModified('board1.shots'); // 自己增加了射击记录
    } else {
      game.markModified('board1'); // 对手棋盘被修改（船只状态）
      game.markModified('board2.shots'); // 自己增加了射击记录
    }

    await game.save();
    console.log('保存后游戏状态:', { gameId, state: game.state, currentTurn: game.currentTurn, winner: game.winner });
          
    // 使用SSE通知所有关注该游戏的客户端
    notifyGameChange(gameId, hit ? 'hit' : 'miss');
    
    // 返回精简的响应给发起请求的客户端
    res.json({
      success: true,
      hit: hit,
      gameOver: allShipsSunk,
      winner: allShipsSunk ? userId : null, // 返回胜利者ID
      nextTurn: game.currentTurn // 返回下一回合玩家的ID
    });

  } catch (error) {
    console.error('游戏操作失败:', error);
    res.status(500).json({ success: false, message: '操作失败', error: error.message });
  }
}; 