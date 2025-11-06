const mongoose = require('mongoose');
const User = require('./models/User');

console.log('开始连接数据库...');
mongoose.connect('mongodb://localhost:27017/irclite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('数据库连接成功');
  try {
    // 重置用户密码为 "password123"
    console.log('查找用户...');
    const user = await User.findOne({ email: 'nationalpha@qq.com' });
    if (user) {
      console.log('找到用户:', user.username);
      user.password = 'password123';
      await user.save();
      console.log('密码已重置为: password123');
    } else {
      console.log('用户不存在');
    }
  } catch (error) {
    console.error('重置密码失败:', error);
  } finally {
    console.log('关闭数据库连接...');
    mongoose.connection.close();
  }
}).catch(err => console.error('MongoDB 连接失败:', err));