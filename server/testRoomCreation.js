require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/irclite', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testRoomCreation() {
  try {
    console.log('开始测试聊天室创建...');
    
    // 获取测试用户
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.error('测试用户不存在');
      return;
    }
    
    console.log('找到测试用户:', user._id);
    
    // 创建聊天室
    const room = new Room({
      name: '测试聊天室',
      description: '这是一个测试聊天室',
      type: 'public',
      participants: [user._id],
      admin: user._id
    });
    
    // 生成群聊代码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    room.inviteCode = code;
    
    console.log('准备保存聊天室...');
    await room.save();
    console.log('聊天室创建成功:', room);
    
    // 查找聊天室
    const foundRoom = await Room.findById(room._id);
    if (foundRoom) {
      console.log('聊天室查找成功:', foundRoom.name);
    } else {
      console.error('无法找到创建的聊天室');
    }
    
    console.log('聊天室创建测试完成');
  } catch (error) {
    console.error('聊天室创建测试失败:', error);
  } finally {
    mongoose.disconnect();
  }
}

testRoomCreation();