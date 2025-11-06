const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器，只允许图片
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: fileFilter
});

// 上传图片
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    // 构建文件URL
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
    const fileUrl = `${serverUrl}/uploads/${req.file.filename}`;
    
    res.json({
      message: '图片上传成功',
      imageUrl: fileUrl
    });
  } catch (error) {
    console.error('图片上传错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超过限制(5MB)' });
    }
  }
  
  if (error.message === '只允许上传图片文件') {
    return res.status(400).json({ message: error.message });
  }
  
  res.status(500).json({ message: '服务器错误' });
});

module.exports = router;