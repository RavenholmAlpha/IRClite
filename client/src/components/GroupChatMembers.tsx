import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import Modal from './Modal';
import Button from './Button';
import './GroupChatMembers.css';

interface GroupChatMembersProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  messageId?: string; // 如果提供，则显示该消息的已读状态
}

const GroupChatMembers: React.FC<GroupChatMembersProps> = ({ 
  isOpen, 
  onClose, 
  roomId, 
  messageId 
}) => {
  const { currentRoom, getMessageReadStatus } = useChat();
  const [readStatus, setReadStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMessageReadStatus = useCallback(async () => {
    if (!messageId) return;
    
    setLoading(true);
    try {
      const status = await getMessageReadStatus(messageId);
      setReadStatus(status);
    } catch (error) {
      console.error('获取消息已读状态失败:', error);
    } finally {
      setLoading(false);
    }
  }, [messageId, getMessageReadStatus]);

  useEffect(() => {
    if (isOpen && messageId) {
      fetchMessageReadStatus();
    }
  }, [isOpen, messageId, fetchMessageReadStatus]);

  if (!currentRoom) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={messageId ? "消息已读状态" : "群聊成员"}
      size="medium"
    >
      <div className="group-members-container">
        {messageId ? (
          // 显示消息已读状态
          <div className="message-read-status">
            {loading ? (
              <div className="loading">加载中...</div>
            ) : readStatus ? (
              <div className="read-status-list">
                <div className="read-status-summary">
                  <p>
                    已读: {readStatus.readBy?.length || 0} / {currentRoom.participants?.length || 0} 人
                  </p>
                </div>
                <div className="members-list">
                  {currentRoom.participants?.map((participant: any) => {
                    const isReadBy = readStatus.readBy?.some((reader: any) => 
                      reader._id === participant._id
                    );
                    
                    return (
                      <div key={participant._id} className="member-item">
                        <div className="member-avatar">
                          {participant.avatar ? (
                            <img src={participant.avatar} alt={participant.username} />
                          ) : (
                            <div className="avatar-placeholder">
                              {participant.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="member-info">
                          <div className="member-name">{participant.username}</div>
                          <div className="member-status">
                            {isReadBy ? (
                              <span className="read-status read">已读</span>
                            ) : (
                              <span className="read-status unread">未读</span>
                            )}
                          </div>
                        </div>
                        <div className="member-read-indicator">
                          {isReadBy ? (
                            <span className="read-indicator">✓✓</span>
                          ) : (
                            <span className="read-indicator pending">○</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="error">获取已读状态失败</div>
            )}
          </div>
        ) : (
          // 显示群聊成员列表
          <div className="members-list">
            {currentRoom.participants?.map((participant: any) => (
              <div key={participant._id} className="member-item">
                <div className="member-avatar">
                  {participant.avatar ? (
                    <img src={participant.avatar} alt={participant.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="member-info">
                  <div className="member-name">{participant.username}</div>
                  <div className="member-status">
                    {participant.isOnline ? (
                      <span className="online-status">在线</span>
                    ) : (
                      <span className="offline-status">离线</span>
                    )}
                  </div>
                </div>
                <div className="member-role">
                  {currentRoom.admin?._id === participant._id && (
                    <span className="admin-badge">管理员</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="modal-actions">
        <Button variant="primary" onClick={onClose}>
          关闭
        </Button>
      </div>
    </Modal>
  );
};

export default GroupChatMembers;