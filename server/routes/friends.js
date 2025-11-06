const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取用户的好友列表
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username email avatar isOnline lastSeen');
    
    res.json({
      message: '获取好友列表成功',
      data: user.friends
    });
  } catch (error) {
    console.error('获取好友列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 发送好友请求
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    
    if (!recipientId) {
      return res.status(400).json({ message: '请提供接收者ID' });
    }
    
    // 不能添加自己为好友
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: '不能添加自己为好友' });
    }
    
    // 检查接收者是否存在
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 检查是否已经是好友
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends.includes(recipientId)) {
      return res.status(400).json({ message: '已经是好友关系' });
    }
    
    // 检查是否已经发送过好友请求
    const existingRequest = recipient.friendRequests.find(
      request => 
        request.sender.toString() === req.user._id.toString() && 
        request.status === 'pending'
    );
    
    if (existingRequest) {
      return res.status(400).json({ message: '已发送过好友请求，请等待对方处理' });
    }
    
    // 添加好友请求
    recipient.friendRequests.push({
      sender: req.user._id,
      status: 'pending'
    });
    
    await recipient.save();
    
    res.json({
      message: '好友请求已发送',
      data: { recipientId }
    });
  } catch (error) {
    console.error('发送好友请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取收到的好友请求
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friendRequests.sender', 'username email avatar isOnline lastSeen');
    
    // 只返回待处理的好友请求
    const pendingRequests = user.friendRequests.filter(
      request => request.status === 'pending'
    );
    
    res.json({
      message: '获取好友请求列表成功',
      data: pendingRequests
    });
  } catch (error) {
    console.error('获取好友请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 处理好友请求（接受或拒绝）
router.put('/requests/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' 或 'reject'
    
    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: '请提供有效的操作（accept 或 reject）' });
    }
    
    const user = await User.findById(req.user._id);
    
    // 查找好友请求
    const requestIndex = user.friendRequests.findIndex(
      request => request._id.toString() === requestId && request.status === 'pending'
    );
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: '好友请求不存在或已处理' });
    }
    
    const request = user.friendRequests[requestIndex];
    const senderId = request.sender;
    
    // 更新请求状态
    user.friendRequests[requestIndex].status = action === 'accept' ? 'accepted' : 'rejected';
    await user.save();
    
    // 如果接受请求，建立好友关系
    if (action === 'accept') {
      // 将发送者添加到当前用户的好友列表
      user.friends.push(senderId);
      await user.save();
      
      // 将当前用户添加到发送者的好友列表
      const sender = await User.findById(senderId);
      sender.friends.push(req.user._id);
      await sender.save();
      
      res.json({
        message: '已接受好友请求',
        data: {
          friend: await User.findById(senderId).select('username email avatar isOnline lastSeen')
        }
      });
    } else {
      res.json({
        message: '已拒绝好友请求'
      });
    }
  } catch (error) {
    console.error('处理好友请求错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除好友
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    // 检查好友是否存在
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 从当前用户的好友列表中移除
    const currentUser = await User.findById(req.user._id);
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== friendId
    );
    await currentUser.save();
    
    // 从对方的好友列表中移除当前用户
    friend.friends = friend.friends.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await friend.save();
    
    res.json({
      message: '已删除好友'
    });
  } catch (error) {
    console.error('删除好友错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建私聊房间
router.post('/direct-message/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    // 检查好友是否存在
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 检查是否是好友关系
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.friends.includes(friendId)) {
      return res.status(403).json({ message: '只能与好友创建私聊' });
    }
    
    // 检查是否已存在私聊房间
    const existingRoom = await Room.findOne({
      type: 'direct',
      participants: { $all: [req.user._id, friendId], $size: 2 }
    });
    
    if (existingRoom) {
      return res.status(400).json({ 
        message: '已存在私聊房间',
        data: existingRoom
      });
    }
    
    // 创建新的私聊房间
    const room = new Room({
      name: friend.username, // 只显示好友名称，就像微信一样
      type: 'direct',
      participants: [req.user._id, friendId]
    });
    
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate('participants', 'username avatar isOnline');
    
    res.status(201).json({
      message: '私聊房间创建成功',
      data: populatedRoom
    });
  } catch (error) {
    console.error('创建私聊房间错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有私聊房间
router.get('/direct-messages', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      type: 'direct',
      participants: req.user._id
    })
    .populate('participants', 'username avatar isOnline')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });
    
    res.json({
      message: '获取私聊房间列表成功',
      data: rooms
    });
  } catch (error) {
    console.error('获取私聊房间列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;