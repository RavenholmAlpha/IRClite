const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/irclite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  try {
    const users = await User.find({});
    console.log('用户列表:');
    users.forEach(user => {
      console.log(`ID: ${user._id}, 用户名: ${user.username}, 邮箱: ${user.email}`);
    });
  } catch (error) {
    console.error('查询用户失败:', error);
  } finally {
    mongoose.connection.close();
  }
}).catch(err => console.error('MongoDB 连接失败:', err));