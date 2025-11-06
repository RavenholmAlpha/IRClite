import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastContainer';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import InviteCode from './InviteCode';
import GroupChatMembers from './GroupChatMembers';
import { Message } from '../types';
import { formatTime, isToday, isYesterday } from '../utils/helpers';
import { validateMessage } from '../utils/validation';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';
import './Chat.css';

const Chat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { 
    rooms,
    currentRoom, 
    messages, 
    sendMessage, 
    setCurrentRoom, 
    fetchMessages, 
    leaveRoom,
    markRoomAsRead,
    getMessageReadStatus
  } = useChat();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [messageText, setMessageText] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageReadStatus, setMessageReadStatus] = useState<{ [messageId: string]: any }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (roomId) {
      // 获取房间信息并设置为当前房间
      const room = rooms.find(r => r._id === roomId);
      if (room) {
        setCurrentRoom(room);
        // 标记聊天室消息为已读
        markRoomAsRead(roomId);
      }
    }
  }, [roomId, rooms, setCurrentRoom, markRoomAsRead]); // 移除currentRoom依赖

  useEffect(() => {
    if (roomId && currentRoom && currentRoom._id === roomId) {
      // 只有当当前房间ID与URL中的ID匹配时才获取消息
      fetchMessages(roomId);
    }
  }, [roomId, currentRoom?._id, fetchMessages]); // 移除currentRoom依赖

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取消息已读状态
  useEffect(() => {
    const fetchReadStatus = async () => {
      const statusMap: { [messageId: string]: any } = {};
      
      // 只获取最新的5条自己发送的消息的已读状态，避免过多请求
      const ownMessages = messages.filter(m => m.sender._id === user?._id).slice(-5);
      
      for (const message of ownMessages) {
        // 只获取自己发送的消息的已读状态
        if (message.sender._id === user?._id) {
          const status = await getMessageReadStatus(message._id);
          if (status) {
            statusMap[message._id] = status;
          }
        }
      }
      
      setMessageReadStatus(prevStatus => ({ ...prevStatus, ...statusMap }));
    };
    
    if (messages.length > 0 && user?._id) {
      fetchReadStatus();
    }
  }, [messages.length, user?._id, getMessageReadStatus]); // 使用messages.length而不是messages对象

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    if (error) {
      setError('');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateMessage(messageText);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    
    if (!roomId) return;
    
    setIsSubmitting(true);
    
    try {
      await sendMessage(roomId, messageText);
      setMessageText('');
    } catch (error) {
      showToast('发送消息失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    
    setIsSubmitting(true);
    
    try {
      await leaveRoom(roomId);
      showToast('已离开聊天室', 'success');
      navigate('/chat');
    } catch (error) {
      showToast('离开聊天室失败', 'error');
    } finally {
      setIsSubmitting(false);
      setShowLeaveModal(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      showToast('只支持上传图片文件', 'error');
      return;
    }
    
    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('图片大小不能超过5MB', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 导入uploadAPI
      const { uploadAPI } = await import('../services/api');
      
      // 上传图片
      const response = await uploadAPI.uploadImage(file);
      
      if (response.imageUrl) {
        // 发送图片消息
        await sendMessage(roomId, response.imageUrl, 'image');
        showToast('图片发送成功', 'success');
      } else {
        showToast(response.message || '图片上传失败', 'error');
      }
    } catch (error) {
      console.error('图片上传错误:', error);
      showToast('图片上传失败', 'error');
    } finally {
      setIsSubmitting(false);
      
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 判断消息是否已读
  const isMessageRead = (message: Message) => {
    if (message.sender._id !== user?._id) {
      return null; // 不显示别人消息的已读状态
    }
    
    const status = messageReadStatus[message._id];
    if (!status) {
      return React.createElement(FaCheck as any, { className: "message-status message-status-sent" }); // 已发送
    }
    
    const readCount = status.totalReadCount;
    const roomParticipants = currentRoom?.participants?.length || 1;
    
    if (readCount >= roomParticipants - 1) {
      return React.createElement(FaCheckDouble as any, { className: "message-status message-status-read" }); // 已读
    } else if (readCount > 0) {
      return React.createElement(FaCheckDouble as any, { className: "message-status message-status-delivered" }); // 已送达
    } else {
      return React.createElement(FaCheck as any, { className: "message-status message-status-sent" }); // 已发送
    }
  };

  // 显示消息已读状态
  const showMessageReadStatus = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowMembersModal(true);
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender._id === user?._id;
    const messageClass = isOwnMessage ? 'message--own' : 'message';
    
    return (
      <div key={message._id} className={`message ${messageClass}`}>
        {!isOwnMessage && (
          <div className="message-avatar">
            {message.sender?.username ? message.sender.username.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        <div className="message-content">
          {!isOwnMessage && (
            <div className="message-sender">{message.sender?.username || '未知用户'}</div>
          )}
          
          {/* 根据消息类型显示不同内容 */}
          {message.type === 'image' ? (
            <div className="message-image">
              <img 
                src={message.content} 
                alt="图片消息" 
                onClick={() => setPreviewImage(message.content)}
                style={{ maxWidth: '100%', maxHeight: '200px', cursor: 'pointer' }}
              />
            </div>
          ) : (
            <div className="message-text">{message.content}</div>
          )}
          
          <div className="message-info">
            <span className="message-time">
              {formatTime(message.createdAt)}
            </span>
            <span 
              onClick={() => showMessageReadStatus(message._id)}
              className="message-status-clickable"
            >
              {isMessageRead(message)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderDateSeparator = (date: string) => {
    let dateText = '';
    
    if (isToday(date)) {
      dateText = '今天';
    } else if (isYesterday(date)) {
      dateText = '昨天';
    } else {
      dateText = new Date(date).toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric'
      });
    }
    
    return (
      <div key={`date-${date}`} className="date-separator">
        <div className="date-separator-line"></div>
        <div className="date-separator-text">{dateText}</div>
        <div className="date-separator-line"></div>
      </div>
    );
  };

  const groupMessagesByDate = () => {
    const grouped: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString();
      if (!grouped[messageDate]) {
        grouped[messageDate] = [];
      }
      grouped[messageDate].push(message);
    });
    
    return grouped;
  };
  
  // 获取私聊房间的好友名称
  const getDirectMessageFriendName = (): string => {
    if (!currentRoom || currentRoom.type !== 'direct') return currentRoom?.name || '';
    
    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId');
    
    // 找到对方用户
    const otherParticipant = currentRoom.participants?.find(p => p._id !== currentUserId);
    return otherParticipant ? otherParticipant.username : currentRoom?.name || '';
  };
  
  // 获取私聊房间的好友头像
  const getDirectMessageFriendAvatar = (): string => {
    if (!currentRoom || currentRoom.type !== 'direct') return '';
    
    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId');
    
    // 找到对方用户
    const otherParticipant = currentRoom.participants?.find(p => p._id !== currentUserId);
    return otherParticipant ? otherParticipant.avatar : '';
  };
  
  // 获取私聊房间的好友在线状态
  const getDirectMessageFriendOnlineStatus = (): boolean => {
    if (!currentRoom || currentRoom.type !== 'direct') return false;
    
    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId');
    
    // 找到对方用户
    const otherParticipant = currentRoom.participants?.find(p => p._id !== currentUserId);
    return otherParticipant ? otherParticipant.isOnline : false;
  };

  if (!currentRoom) {
    return (
      <div className="chat-loading">
        <p>加载中...</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate();
  
  return (
    <div className="chat">
      <div className="chat__header">
        <div className="chat-room-info">
          {currentRoom.type === 'direct' ? (
            // 私聊房间显示好友头像和在线状态
            <div className="direct-message-header">
              <div className="friend-avatar">
                {getDirectMessageFriendAvatar() ? (
                  <img src={getDirectMessageFriendAvatar()} alt={getDirectMessageFriendName()} />
                ) : (
                  <div className="avatar-placeholder">
                    {getDirectMessageFriendName().charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`online-status ${getDirectMessageFriendOnlineStatus() ? 'online' : 'offline'}`}></span>
              </div>
              <div className="friend-details">
                <h3>{getDirectMessageFriendName()}</h3>
                <span className="status-text">
                  {getDirectMessageFriendOnlineStatus() ? '在线' : '离线'}
                </span>
              </div>
            </div>
          ) : (
            // 群聊房间显示默认图标
            <>
              <div className="chat-room-avatar">
                {currentRoom.type === 'private' ? '🔒' : '👥'}
              </div>
              <div className="chat-room-details">
                <h3>{currentRoom.name}</h3>
                <span className="participant-count">
                  {currentRoom.participants?.length || 0} 人
                </span>
              </div>
            </>
          )}
        </div>
        <div className="chat-header-actions">
          {currentRoom.type !== 'direct' && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => {
                setSelectedMessageId(null);
                setShowMembersModal(true);
              }}
            >
              成员列表
            </Button>
          )}
          {currentRoom.type === 'public' && (
            <Button
              variant="ghost"
              size="small"
              onClick={() => setShowInviteCodeModal(true)}
            >
              群聊代码
            </Button>
          )}
          <Button
            variant="ghost"
            size="small"
            onClick={() => setShowLeaveModal(true)}
          >
            离开聊天室
          </Button>
        </div>
      </div>
      
      <div className="chat__messages">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="chat-empty">
            <p>暂无消息</p>
            <p>发送第一条消息开始聊天</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <React.Fragment key={date}>
                {renderDateSeparator(date)}
                {dateMessages.map(renderMessage)}
              </React.Fragment>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat__input-form">
        <form onSubmit={handleSendMessage} className="chat__input">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={handleFileUpload}
            className="chat-file-button"
          >
            📎
          </Button>
          <Input
            type="text"
            placeholder="输入消息..."
            value={messageText}
            onChange={handleMessageChange}
            error={error}
            className="chat-message-input"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            variant="primary"
            size="small"
            disabled={!messageText.trim() || isSubmitting}
            loading={isSubmitting}
            className="chat-send-button"
          >
            发送
          </Button>
        </form>
      </div>

      {/* 离开聊天室确认模态框 */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="离开聊天室"
        size="small"
      >
        <p>确定要离开 "{currentRoom.name}" 聊天室吗？</p>
        <div className="modal-buttons">
          <Button
            variant="ghost"
            onClick={() => setShowLeaveModal(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            variant="danger"
            onClick={handleLeaveRoom}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            离开
          </Button>
        </div>
      </Modal>
      
      {/* 群聊代码模态框 */}
      <InviteCode
        room={currentRoom}
        isOpen={showInviteCodeModal}
        onClose={() => setShowInviteCodeModal(false)}
      />
      
      {/* 群聊成员列表模态框 */}
      <GroupChatMembers
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        roomId={currentRoom._id}
        messageId={selectedMessageId || undefined}
      />
      
      {/* 图片预览模态框 */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        size="large"
        showCloseButton={false}
        closeOnOverlayClick={true}
      >
        {previewImage && (
          <div className="image-preview">
            <div className="image-preview-container">
              <img 
                src={previewImage} 
                alt="图片预览" 
                className="image-preview-img"
              />
              <button 
                className="image-preview-close"
                onClick={() => setPreviewImage(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Chat;