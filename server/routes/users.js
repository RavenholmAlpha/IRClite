const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取所有用户（除了当前用户）
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username email avatar isOnline lastSeen')
      .sort({ isOnline: -1, username: 1 });
    
    res.json({ data: users });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 搜索用户
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: '搜索关键词不能为空' });
    }
    
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      username: { $regex: q, $options: 'i' }
    })
      .select('username email avatar isOnline lastSeen')
      .sort({ isOnline: -1, username: 1 })
      .limit(20);
    
    res.json({ data: users });
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户详情
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username email avatar isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/:id', auth, async (req, res) => {
  try {
    // 只允许用户更新自己的信息
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: '无权限更新此用户信息' });
    }
    
    const { username, email, avatar } = req.body;
    const updateData = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json({
      message: '用户信息更新成功',
      user
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    
    // 处理重复键错误
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field === 'username' ? '用户名' : '邮箱'}已存在` 
      });
    }
    
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;