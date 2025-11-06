const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取用户的所有聊天室
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      participants: req.user._id
    })
    .populate('participants', 'username avatar isOnline')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });
    
    // 为每个房间添加未读消息数量
    const roomsWithUnreadCount = await Promise.all(rooms.map(async (room) => {
      // 获取用户加入房间的时间
      const userId = req.user._id.toString();
      const userObjectId = req.user._id;
      
      // 查找用户加入房间后的所有消息
      const messages = await Message.find({
        room: room._id,
        sender: { $ne: userObjectId }, // 排除自己发送的消息
        'readBy.user': { $ne: userObjectId } // 排除已读的消息
      });
      
      // 计算未读消息数量
      const unreadCount = messages.length;
      
      return {
        ...room.toObject(),
        unreadCount
      };
    }));
    
    res.json({
      message: '获取聊天室列表成功',
      data: roomsWithUnreadCount
    });
  } catch (error) {
    console.error('获取聊天室列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 生成唯一的群聊代码
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 创建新的群聊房间
router.post('/rooms', auth, async (req, res) => {
  try {
    const { name, description, participants } = req.body;
    
    // 生成唯一的群聊代码
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existingRoom = await Room.findOne({ inviteCode });
      if (!existingRoom) {
        isUnique = true;
      }
    }
    
    const room = new Room({
      name,
      description: description || '',
      type: 'public',
      inviteCode,
      participants: [...participants, req.user._id],
      admin: req.user._id
    });
    
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'username avatar isOnline')
      .populate('admin', 'username avatar');
    
    res.status(201).json({
      message: '聊天室创建成功',
      data: populatedRoom
    });
  } catch (error) {
    console.error('创建聊天室错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取聊天室详情
router.get('/rooms/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('participants', 'username avatar isOnline')
      .populate('admin', 'username avatar');
    
    if (!room) {
      return res.status(404).json({ message: '聊天室不存在' });
    }
    
    // 检查用户是否是聊天室参与者
    if (!room.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: '无权限访问此聊天室' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('获取聊天室详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取聊天室消息
router.get('/rooms/:id/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: '聊天室不存在' });
    }
    
    // 检查用户是否是聊天室参与者
    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({ message: '无权限访问此聊天室' });
    }
    
    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username avatar isOnline')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json({
      message: '获取聊天消息成功',
      data: messages.reverse()
    });
  } catch (error) {
    console.error('获取聊天消息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 通过群聊代码加入聊天室
router.post('/rooms/join-by-code', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({ message: '请提供群聊代码' });
    }
    
    // 查找具有该群聊代码的聊天室
    const room = await Room.findOne({ inviteCode });
    
    if (!room) {
      return res.status(404).json({ message: '群聊代码无效或聊天室不存在' });
    }
    
    // 检查用户是否已在聊天室中
    if (room.participants.includes(req.user._id)) {
      return res.status(400).json({ message: '您已在此聊天室中' });
    }
    
    // 添加用户到聊天室
    room.participants.push(req.user._id);
    room.lastActivity = new Date();
    await room.save();
    
    const updatedRoom = await Room.findById(room._id)
      .populate('participants', 'username avatar isOnline')
      .populate('admin', 'username avatar');
    
    res.json({
      message: '成功加入聊天室',
      data: updatedRoom
    });
  } catch (error) {
    console.error('通过群聊代码加入聊天室错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取聊天室的群聊代码
router.get('/rooms/:id/invite-code', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '聊天室不存在' });
    }
    
    // 检查用户是否是聊天室参与者
    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({ message: '无权限访问此聊天室' });
    }
    
    // 如果聊天室没有群聊代码，生成一个
    if (!room.inviteCode) {
      let inviteCode;
      let isUnique = false;
      
      while (!isUnique) {
        inviteCode = generateInviteCode();
        const existingRoom = await Room.findOne({ inviteCode });
        if (!existingRoom) {
          isUnique = true;
        }
      }
      
      room.inviteCode = inviteCode;
      await room.save();
    }
    
    res.json({
      message: '获取群聊代码成功',
      data: { inviteCode: room.inviteCode }
    });
  } catch (error) {
    console.error('获取群聊代码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 重置聊天室的群聊代码
router.post('/rooms/:id/reset-invite-code', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '聊天室不存在' });
    }
    
    // 检查用户是否是聊天室管理员
    if (room.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '只有管理员可以重置群聊代码' });
    }
    
    // 生成新的群聊代码
    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existingRoom = await Room.findOne({ inviteCode });
      if (!existingRoom) {
        isUnique = true;
      }
    }
    
    room.inviteCode = inviteCode;
    await room.save();
    
    res.json({
      message: '群聊代码重置成功',
      data: { inviteCode: room.inviteCode }
    });
  } catch (error) {
    console.error('重置群聊代码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 加入聊天室
router.post('/rooms/:id/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '聊天室不存在' });
    }
    
    // 检查用户是否已在聊天室中
    if (room.participants.includes(req.user._id)) {
      return res.status(400).json({ message: '您已在此聊天室中' });
    }
    
    // 添加用户到聊天室
    room.participants.push(req.user._id);
    await room.save();
    
    const updatedRoom = await Room.findById(room._id)
      .populate('participants', 'username avatar isOnline');
    
    res.json({
      message: '成功加入聊天室',
      data: updatedRoom
    });
  } catch (error) {
    console.error('加入聊天室错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 离开聊天室
router.post('/rooms/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '聊天室不存在' });
    }
    
    // 检查用户是否在聊天室中
    if (!room.participants.includes(req.user._id)) {
      return res.status(400).json({ message: '您不在此聊天室中' });
    }
    
    // 从聊天室中移除用户
    room.participants = room.participants.filter(
      p => p.toString() !== req.user._id.toString()
    );
    
    // 如果用户是管理员且聊天室还有其他参与者，将管理权转移给第一个参与者
    if (room.admin.toString() === req.user._id.toString() && room.participants.length > 0) {
      room.admin = room.participants[0];
    }
    
    // 如果聊天室没有参与者了，删除聊天室
    if (room.participants.length === 0) {
      await Room.findByIdAndDelete(req.params.id);
      await Message.deleteMany({ room: req.params.id });
      
      return res.json({ message: '已离开聊天室，聊天室已删除' });
    }
    
    await room.save();
    
    res.json({ message: '已成功离开聊天室' });
  } catch (error) {
    console.error('离开聊天室错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 标记聊天室消息为已读
router.post('/rooms/:id/read', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: '聊天室不存在' });
    }
    
    // 检查用户是否在聊天室中
    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({ message: '无权限访问此聊天室' });
    }
    
    // 获取用户未读的消息
    const unreadMessages = await Message.find({
      room: req.params.id,
      sender: { $ne: req.user._id }, // 排除自己发送的消息
      'readBy.user': { $ne: req.user._id } // 排除已读的消息
    });
    
    // 标记所有未读消息为已读
    const updatePromises = unreadMessages.map(message => {
      return Message.updateOne(
        { _id: message._id, 'readBy.user': { $ne: req.user._id } },
        { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.json({ message: '消息已标记为已读' });
  } catch (error) {
    console.error('标记消息已读错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取消息的已读状态
router.get('/messages/:id/read-status', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('readBy.user', 'username avatar');
    
    if (!message) {
      return res.status(404).json({ message: '消息不存在' });
    }
    
    // 检查用户是否有权限访问此消息
    const room = await Room.findById(message.room);
    if (!room || !room.participants.includes(req.user._id)) {
      return res.status(403).json({ message: '无权限访问此消息' });
    }
    
    res.json({
      message: '获取消息已读状态成功',
      data: {
        messageId: message._id,
        readBy: message.readBy,
        totalReadCount: message.readBy.length
      }
    });
  } catch (error) {
    console.error('获取消息已读状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;