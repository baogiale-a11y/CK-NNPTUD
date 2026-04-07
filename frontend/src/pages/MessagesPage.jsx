import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import http from '../api/http';
import socket from '../socket/socket';
import { useAuth } from '../context/AuthContext';

const getAttachmentUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}/${path.replace(/\\/g, '/').replace(/^\//, '')}`;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [partnerId, setPartnerId] = useState(searchParams.get('to') || '');
  const [groupId, setGroupId] = useState(searchParams.get('group') || '');
  const [partner, setPartner] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const messagesEndRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchConversationsList = async () => {
    try {
      const { data } = await http.get('/messages/conversations');
      setConversations(data?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách hội thoại', err);
    }
  };

  const fetchGroupMessages = async () => {
    if (!groupId) return;
    try {
      const { data } = await http.get(`/messages/groups/${groupId}/messages`);
      setMessages(data?.data || []);
      
      http.put(`/messages/groups/${groupId}/read`).catch(console.error);
    } catch (err) {
      console.error('Lỗi tải tin nhắn nhóm:', err);
    }
  };

  useEffect(() => {
    fetchConversationsList();
  }, []);

  useEffect(() => {
    const to = searchParams.get('to');
    const group = searchParams.get('group');
    if (to && to !== partnerId) {
      setPartnerId(to);
      setActiveTab('personal');
      setGroupId('');
    } else if (group && group !== groupId) {
      setGroupId(group);
      setActiveTab('group');
      setPartnerId('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const delay = setTimeout(async () => {
      try {
        const { data } = await http.get(`/users/search?name=${searchQuery}`);
        setSearchResults((data?.data || []).filter(u => u._id !== user?._id));
      } catch (err) {
        console.error('Lỗi tìm kiếm user', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const selectPartner = (selectedUser) => {
    setPartner(selectedUser);
    setPartnerId(selectedUser._id);
    setSearchParams({ to: selectedUser._id });
    setSearchQuery('');
    setSearchResults([]);
  };

  const fetchPersonalConversation = useCallback(async () => {
    if (!partnerId.trim()) return;
    try {
      setMsg('');
      const { data } = await http.get(`/messages/${partnerId}`);
      const list = data?.data?.items || data?.data || [];
      setMessages(Array.isArray(list) ? list : []);

      if (!partner) {
        let foundPartner = null;
        if (list.length > 0) {
          const sampleMsg = list.find(m => String(m.sender?._id || m.sender) === partnerId || String(m.receiver?._id || m.receiver) === partnerId);
          if (sampleMsg) {
            foundPartner = String(sampleMsg.sender?._id || sampleMsg.sender) === partnerId ? sampleMsg.sender : sampleMsg.receiver;
          }
        }
        if (foundPartner && foundPartner.username) {
          setPartner(foundPartner);
        } else {
          try {
            const userRes = await http.get(`/users/${partnerId}`);
            const uData = userRes.data?.data;
            if (uData) setPartner({ _id: uData._id, username: uData.username, avatar: uData.avatar });
          } catch (uErr) {
            console.error('Không tải được info user:', uErr);
          }
        }
      }

      const unreadIds = list.filter(m => String(m.receiver?._id || m.receiver) === String(user?._id) && !m.isRead).map(m => m._id);
      if (unreadIds.length > 0) {
        Promise.all(unreadIds.map(msgId => http.put(`/messages/${msgId}/read`)))
          .then(() => window.dispatchEvent(new Event('messages:read')))
          .catch(console.error);
      }
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Không tải được hội thoại');
    }
  }, [partnerId, user?._id]);

  useEffect(() => {
    const loadChat = async () => {
      if (groupId) {
        await fetchGroupMessages();
      } else if (partnerId) {
        await fetchPersonalConversation();
      }
    };
    loadChat();
  }, [partnerId, groupId]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    socket.connect();
    socket.emit('auth:join', { token });

    const onReceive = (payload) => {
      if (payload.receiver === partnerId || payload.sender === partnerId) {
        setMessages((prev) => [...prev, payload]);
        
        if (payload.sender === partnerId && String(payload.receiver) === String(user?._id)) {
           http.put(`/messages/${payload._id}/read`)
             .then(() => window.dispatchEvent(new Event('messages:read')))
             .catch(console.error);
        }
      }
    };

    socket.on('message:receive', onReceive);

    return () => {
      socket.off('message:receive', onReceive);
      socket.disconnect();
    };
  }, [partnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onSend = async (e) => {
    e.preventDefault();
    if (!partnerId.trim() || (!text.trim() && !selectedFile)) return;

    try {
      let attachmentUrl = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await http.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = uploadRes.data?.data?.path || uploadRes.data?.path;
      }

      const body = { receiver: partnerId, content: text || 'Đã gửi một tệp đính kèm' };
      if (attachmentUrl) body.attachment = attachmentUrl;

      const { data } = await http.post('/messages', body);
      const created = data?.data || data;
      setMessages((prev) => [...prev, created]);
      setText('');
      setSelectedFile(null);
      fetchConversationsList();
    } catch (err) {
      alert(err?.response?.data?.message || 'Gửi tin nhắn thất bại');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="messages-container fade-in">
      <div className="page-header">
        <h1 className="page-title">💬 Tin nhắn</h1>
        <p className="page-subtitle muted">Trò chuyện với bạn bè và cộng đồng học tập</p>
      </div>

      <div className="chat-container">
        {/* Sidebar - Danh sách cuộc trò chuyện */}
        <div className="chat-sidebar">
          <div className="chat-header">
            <h2 className="section-title">Cuộc trò chuyện</h2>
            <div className="chat-search">
              <input
                className="input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm kiếm bạn bè..."
              />
            </div>
          </div>
          
          <div className="chat-conversations">
            {searchQuery ? (
              <div className="search-results">
                {isSearching ? <p className="muted small" style={{ padding: '10px', textAlign: 'center' }}>Đang tìm kiếm...</p> : 
                 searchResults.length > 0 ? searchResults.map(u => (
                   <div key={u._id} className="conversation-item fade-in" onClick={() => selectPartner(u)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                     <img src={`https://ui-avatars.com/api/?name=${u.username}&background=random`} className="conversation-avatar" alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                     <div className="conversation-info">
                       <div className="conversation-name" style={{ fontWeight: 600 }}>{u.username}</div>
                     </div>
                   </div>
                 )) : <p className="muted small" style={{ padding: '10px', textAlign: 'center' }}>Không tìm thấy người dùng</p>
                }
              </div>
            ) : conversations.length > 0 ? (
              conversations.map(conv => {
                const otherUser = conv.partner;
                const lastMsg = conv.lastMessage;
                return (
                  <div key={otherUser?._id} className={`conversation-item ${partnerId === otherUser?._id ? 'active' : ''}`} onClick={() => selectPartner(otherUser)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid var(--border)', background: partnerId === otherUser?._id ? 'var(--bg-light)' : 'transparent' }}>
                    <img src={`https://ui-avatars.com/api/?name=${otherUser?.username || 'U'}&background=random`} className="conversation-avatar" alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div className="conversation-info" style={{ flex: 1, minWidth: 0 }}>
                      <div className="conversation-name" style={{ fontWeight: 600 }}>{otherUser?.username || 'Người dùng'}</div>
                      <div className="conversation-preview muted small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                        {lastMsg?.content}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state small">
                <div className="empty-icon">💭</div>
                <p>Nhập ID người dùng để bắt đầu trò chuyện</p>
                <p className="muted tiny">Lịch sử tin nhắn sẽ hiển thị tự động</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat chính */}
        <div className="chat-main">
          <div className="chat-header-main" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', minHeight: '73px', display: 'flex', alignItems: 'center' }}>
            {partnerId ? (
              <div className="chat-partner" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                <img src={`https://ui-avatars.com/api/?name=${partner?.username || 'U'}&background=random`} className="partner-avatar" alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div className="partner-name" style={{ fontWeight: 600, fontSize: '1.1rem' }}>{partner?.username || 'Đang trò chuyện'}</div>
              </div>
            ) : (
              <div className="welcome-chat">
                <div className="welcome-icon">💬</div>
                <h3>Chào mừng đến với Messenger</h3>
                <p>Nhập tên người dùng vào ô tìm kiếm để bắt đầu trò chuyện</p>
              </div>
            )}
          </div>

          <div className="chat-messages">
            {messages.length > 0 ? (
              messages.map((m, idx) => {
                const isMe = (m.sender?._id || m.sender) === user?._id;
                return (
                  <div key={m._id || idx} className={`msg-bubble ${isMe ? 'msg-sent' : 'msg-received'} fade-in`}>
                    {!isMe && (
                      <div className="msg-sender muted small">
                        {m.sender?.username || 'Bạn'}
                      </div>
                    )}
                    <div className="msg-content" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Hiển thị ảnh nếu có attachment */}
                      {m.attachment && (
                        <img 
                          src={getAttachmentUrl(m.attachment)} 
                          alt="attachment" 
                          style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', cursor: 'zoom-in', objectFit: 'cover' }}
                          onClick={() => window.open(getAttachmentUrl(m.attachment), '_blank')}
                        />
                      )}
                      {/* Chỉ hiển thị text nếu không phải là text mặc định khi gửi kèm file */}
                      {m.content && m.content !== 'Đã gửi một tệp đính kèm' && <span>{m.content}</span>}
                    </div>
                    <div className="msg-time muted tiny">
                      {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                );
              })
            ) : partnerId ? (
              <div className="empty-chat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', textAlign: 'center', flex: 1 }}>
                <div className="empty-icon" style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '16px' }}>📨</div>
                <p className="muted">Hãy gửi tin nhắn đầu tiên!</p>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area" style={{ padding: '16px 24px', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            {/* Hiển thị Preview File nếu có */}
            {selectedFile && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '8px', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)', width: 'fit-content', border: '1px solid var(--border)' }}>
                {selectedFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                  <div style={{ width: '60px', height: '60px', background: 'var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📎</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '16px' }}>
                  <span className="small" style={{ fontWeight: 600, color: 'var(--text-main)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile.name}</span>
                  <span className="tiny muted">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>✕</button>
              </div>
            )}
            
            {/* Khung nhập liệu một hàng ngang */}
            <form onSubmit={onSend} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', width: '100%' }}>
                <input type="file" className="hidden" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Đính kèm">📎</button>
                <input
                  className="input"
                  style={{ flex: 1, borderRadius: '24px', padding: '12px 16px', border: '1px solid var(--border)', background: 'var(--bg-light)' }}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập tin nhắn của bạn..."
                  disabled={!partnerId}
                />
                <button type="submit" disabled={!partnerId || (!text.trim() && !selectedFile)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: partnerId && (text.trim() || selectedFile) ? 'pointer' : 'not-allowed', opacity: partnerId && (text.trim() || selectedFile) ? 1 : 0.5, transition: 'all 0.2s', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.2rem', marginLeft: '4px' }}>➤</span>
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
