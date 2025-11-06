import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useToast } from './ToastContainer';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import { Room } from '../types';
import { formatTime, truncateText } from '../utils/helpers';
import { validateCreateRoomForm } from '../utils/validation';
import './ChatRoomList.css';

const ChatRoomList: React.FC = () => {
  const navigate = useNavigate();
  const { rooms, createRoom, joinRoom, joinRoomByCode, fetchRooms, unreadCounts } = useChat();
  const { showToast } = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'direct'>('all');
  
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: ''
  });
  
  const [joinFormData, setJoinFormData] = useState({
    roomId: ''
  });
  
  const [joinByCodeFormData, setJoinByCodeFormData] = useState({
    inviteCode: ''
  });
  
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});
  const [joinByCodeErrors, setJoinByCodeErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]); // 现在fetchRooms使用了useCallback，可以安全地作为依赖

  const handleCreateRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
    
    if (createErrors[name]) {
      setCreateErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleJoinRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinFormData(prev => ({ ...prev, [name]: value }));
    
    if (joinErrors[name]) {
      setJoinErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleJoinByCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinByCodeFormData(prev => ({ ...prev, [name]: value }));
    
    if (joinByCodeErrors[name]) {
      setJoinByCodeErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 获取私聊房间的好友名称
  const getDirectMessageFriendName = (room: Room): string => {
    if (room.type !== 'direct') return room.name;
    
    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId');
    
    // 找到对方用户
    const otherParticipant = room.participants.find(p => p._id !== currentUserId);
    return otherParticipant ? otherParticipant.username : room.name;
  };
  
  // 获取私聊房间的好友头像
  const getDirectMessageFriendAvatar = (room: Room): string => {
    if (room.type !== 'direct') return '';
    
    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId');
    
    // 找到对方用户
    const otherParticipant = room.participants.find(p => p._id !== currentUserId);
    return otherParticipant ? otherParticipant.avatar : '';
  };
  
  // 过滤房间列表
  const filteredRooms = rooms.filter(room => {
    if (activeTab === 'all') return true;
    if (activeTab === 'groups') return room.type !== 'direct';
    if (activeTab === 'direct') return room.type === 'direct';
    return true;
  });
  
  // 按类型排序房间列表，私聊在前，群聊在后
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (a.type === 'direct' && b.type !== 'direct') return -1;
    if (a.type !== 'direct' && b.type === 'direct') return 1;
    return 0;
  });

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateCreateRoomForm(createFormData);
    if (!validation.isValid) {
      setCreateErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const room = await createRoom(createFormData.name, createFormData.description);
      showToast('聊天室创建成功', 'success');
      setShowCreateModal(false);
      setCreateFormData({ name: '', description: '' });
      navigate(`/chat/${room._id}`);
    } catch (error) {
      showToast('创建聊天室失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinFormData.roomId) {
      setJoinErrors({ roomId: '请输入聊天室ID' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await joinRoom(joinFormData.roomId);
      showToast('已加入聊天室', 'success');
      setShowJoinModal(false);
      setJoinFormData({ roomId: '' });
      navigate(`/chat/${joinFormData.roomId}`);
    } catch (error) {
      showToast('加入聊天室失败', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinByCodeFormData.inviteCode) {
      setJoinByCodeErrors({ inviteCode: '请输入群聊代码' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const room = await joinRoomByCode(joinByCodeFormData.inviteCode);
      showToast('已通过群聊代码加入聊天室', 'success');
      setShowJoinByCodeModal(false);
      setJoinByCodeFormData({ inviteCode: '' });
      navigate(`/chat/${room._id}`);
    } catch (error) {
      showToast('加入聊天室失败，请检查群聊代码是否正确', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoomClick = (roomId: string) => {
    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="chat-room-list">
      <div className="chat-room-header">
        <h2>聊天室</h2>
        <div className="chat-room-actions">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowJoinModal(true)}
          >
            加入聊天室
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowJoinByCodeModal(true)}
          >
            通过代码加入
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreateModal(true)}
          >
            创建聊天室
          </Button>
        </div>
      </div>
      
      <div className="chat-room-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部
        </button>
        <button 
          className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          群聊
        </button>
        <button 
          className={`tab-button ${activeTab === 'direct' ? 'active' : ''}`}
          onClick={() => setActiveTab('direct')}
        >
          私聊
        </button>
      </div>
      
      <div className="chat-room-content">
        {sortedRooms.length === 0 ? (
          <div className="chat-room-empty">
            <p>
              {activeTab === 'all' && '暂无聊天室'}
              {activeTab === 'groups' && '暂无群聊'}
              {activeTab === 'direct' && '暂无私聊'}
            </p>
            <p>创建或加入一个聊天室开始聊天</p>
          </div>
        ) : (
          <ul className="chat-room-items">
            {sortedRooms.map((room: Room) => (
              <li
                key={room._id}
                className="chat-room-item"
                onClick={() => handleRoomClick(room._id)}
              >
                <div className="chat-room-avatar">
                  {room.type === 'direct' ? (
                    // 私聊房间显示好友头像
                    getDirectMessageFriendAvatar(room) ? (
                      <img src={getDirectMessageFriendAvatar(room)} alt={getDirectMessageFriendName(room)} />
                    ) : (
                      <div className="avatar-placeholder">
                        {getDirectMessageFriendName(room).charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : (
                    // 群聊房间显示默认图标
                    room.type === 'private' ? '👥' : '👤'
                  )}
                </div>
                <div className="chat-room-info">
                  <div className="chat-room-name">
                    {room.type === 'direct' ? getDirectMessageFriendName(room) : room.name}
                  </div>
                  {room.description && room.type !== 'direct' && (
                    <div className="chat-room-description">
                      {truncateText(room.description, 50)}
                    </div>
                  )}
                  {room.lastMessage && (
                    <div className="chat-room-last-message">
                      {truncateText(room.lastMessage.content, 30)}
                    </div>
                  )}
                </div>
                <div className="chat-room-meta">
                  {room.lastActivity && (
                    <div className="chat-room-time">
                      {formatTime(room.lastActivity)}
                    </div>
                  )}
                  <div className="chat-room-participants">
                    {room.type === 'direct' ? '私聊' : `${room.participants.length} 人`}
                  </div>
                  {unreadCounts[room._id] > 0 && (
                    <div className="chat-room-unread">
                      <span className="unread-badge">
                        {unreadCounts[room._id] > 99 ? '99+' : unreadCounts[room._id]}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 创建聊天室模态框 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建聊天室"
        size="small"
      >
        <form onSubmit={handleCreateRoom}>
          <Input
            type="text"
            name="name"
            placeholder="请输入聊天室名称"
            value={createFormData.name}
            onChange={handleCreateRoomChange}
            error={createErrors.name}
            label="聊天室名称"
            required
            autoFocus
          />
          
          <Input
            type="text"
            name="description"
            placeholder="请输入聊天室描述（可选）"
            value={createFormData.description}
            onChange={handleCreateRoomChange}
            error={createErrors.description}
            label="描述"
          />
          
          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              创建
            </Button>
          </div>
        </form>
      </Modal>

      {/* 加入聊天室模态框 */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="加入聊天室"
        size="small"
      >
        <form onSubmit={handleJoinRoom}>
          <Input
            type="text"
            name="roomId"
            placeholder="请输入聊天室ID"
            value={joinFormData.roomId}
            onChange={handleJoinRoomChange}
            error={joinErrors.roomId}
            label="聊天室ID"
            required
            autoFocus
          />
          
          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setShowJoinModal(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              加入
            </Button>
          </div>
        </form>
      </Modal>
      {/* 通过群聊代码加入聊天室模态框 */}
      <Modal
        isOpen={showJoinByCodeModal}
        onClose={() => setShowJoinByCodeModal(false)}
        title="通过群聊代码加入"
        size="small"
      >
        <form onSubmit={handleJoinByCode}>
          <Input
            type="text"
            name="inviteCode"
            placeholder="请输入群聊代码"
            value={joinByCodeFormData.inviteCode}
            onChange={handleJoinByCodeChange}
            error={joinByCodeErrors.inviteCode}
            label="群聊代码"
            required
            autoFocus
          />
          
          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setShowJoinByCodeModal(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              加入
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChatRoomList;