require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/irclite', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testJWT() {
  try {
    console.log('开始测试JWT...');
    
    // 获取测试用户
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.error('测试用户不存在');
      return;
    }
    
    console.log('找到测试用户:', user._id);
    
    // 生成JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    console.log('生成的JWT:', token);
    
    // 验证JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT验证成功:', decoded);
    
    // 通过ID查找用户
    const foundUser = await User.findById(decoded.id);
    if (foundUser) {
      console.log('通过JWT找到用户:', foundUser.email);
    } else {
      console.error('无法通过JWT找到用户');
    }
    
    console.log('JWT测试完成');
  } catch (error) {
    console.error('JWT测试失败:', error);
  } finally {
    mongoose.disconnect();
  }
}

testJWT();