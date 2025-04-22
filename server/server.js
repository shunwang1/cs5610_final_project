require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const sseRoutes = require('./routes/sseRoutes');
const Game = require('./models/Game');
const { startGameCleanupScheduler } = require('./utils/gameCleaner');

// 设置环境变量（如果未设置）
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`当前环境: ${process.env.NODE_ENV}`);

const app = express();

// 配置CORS - 允许任何来源的跨域请求
app.use(cors({
  origin: function(origin, callback) {
    // 允许所有来源
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('成功连接到MongoDB');
    
    // 只在开发环境中清除游戏记录
    if (process.env.NODE_ENV === 'development') {
      Game.deleteMany({})
        .then(result => {
          console.log(`开发环境：服务器启动时已清除 ${result.deletedCount} 个游戏记录`);
        })
        .catch(err => {
          console.error('清除游戏记录失败:', err);
        });
      
      // 验证Game模型结构
      console.log('Game模型结构:', Object.keys(Game.schema.paths));
      console.log('currentTurn定义:', Game.schema.path('currentTurn'));
    }
    
    // 使用单一的定时任务清理过期游戏
    startGameCleanupScheduler(1); // 每分钟执行一次
  })
  .catch(err => console.error('MongoDB连接错误:', err));

// Routes
// 确保CORS标头设置
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/sse', sseRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 