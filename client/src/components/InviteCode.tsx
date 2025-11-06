import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useToast } from './ToastContainer';
import Button from './Button';
import Modal from './Modal';
import { Room } from '../types';
import './InviteCode.css';

interface InviteCodeProps {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
}

const InviteCode: React.FC<InviteCodeProps> = ({ room, isOpen, onClose }) => {
  const { getRoomInviteCode, resetRoomInviteCode } = useChat();
  const { showToast } = useToast();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && room) {
      fetchInviteCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, room]);

  const fetchInviteCode = async () => {
    setIsLoading(true);
    try {
      const code = await getRoomInviteCode(room._id);
      setInviteCode(code);
    } catch (error) {
      showToast('获取群聊代码失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCode = async () => {
    setIsResetting(true);
    try {
      const newCode = await resetRoomInviteCode(room._id);
      setInviteCode(newCode);
      showToast('群聊代码已重置', 'success');
    } catch (error) {
      showToast('重置群聊代码失败', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode)
      .then(() => showToast('群聊代码已复制到剪贴板', 'success'))
      .catch(() => showToast('复制失败', 'error'));
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/join?code=${inviteCode}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('邀请链接已复制到剪贴板', 'success'))
      .catch(() => showToast('复制失败', 'error'));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="群聊代码"
      size="small"
    >
      <div className="invite-code-container">
        {isLoading ? (
          <div className="invite-code-loading">加载中...</div>
        ) : (
          <>
            <div className="invite-code-info">
              <p>分享以下群聊代码，邀请其他人加入聊天室：</p>
              <div className="invite-code-display">
                <span className="invite-code-text">{inviteCode}</span>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleCopyCode}
                >
                  复制
                </Button>
              </div>
            </div>
            
            <div className="invite-code-actions">
              <Button
                variant="secondary"
                onClick={handleShareLink}
                disabled={!inviteCode}
              >
                复制邀请链接
              </Button>
              
              {room.admin?._id === localStorage.getItem('userId') && (
                <Button
                  variant="ghost"
                  onClick={handleResetCode}
                  loading={isResetting}
                  disabled={isResetting}
                >
                  重置代码
                </Button>
              )}
            </div>
            
            <div className="invite-code-note">
              <p>注意：群聊代码是公开的，任何人都可以通过它加入聊天室。</p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default InviteCode;