import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

const buildCommentTree = (comments) => {
  const commentMap = {};
  const roots = [];

  comments.forEach((c) => {
    commentMap[c._id] = { ...c, replies: [] };
  });

  comments.forEach((c) => {
    const parentId = c.parentComment?._id || c.parentComment;
    if (parentId && commentMap[parentId]) {
      commentMap[parentId].replies.push(commentMap[c._id]);
    } else {
      roots.push(commentMap[c._id]);
    }
  });

  return roots;
};

const CommentNode = ({ comment, setReplyingTo, onLikeComment, currentUser, onDeleteComment }) => {
  const isCommentOwner = currentUser?._id === comment.author?._id;
  const isAdmin = currentUser?.role?.name === 'admin';
  const canDelete = isCommentOwner || isAdmin;

  return (
    <div className="comment-thread">
    <div className="comment-item fade-in">
      <div className="comment-header">
        <img 
          src={`https://ui-avatars.com/api/?name=${comment.author?.username || 'Anonymous'}&background=random`} 
          alt="Avatar" 
          className="comment-avatar"
        />
        <div className="comment-meta">
          <strong className="comment-author">
            {comment.author?.username || 'Ẩn danh'}
          </strong>
          <span className="comment-time muted small">
            {comment.createdAt ? new Date(comment.createdAt).toLocaleString('vi-VN') : 'Vừa xong'}
          </span>
        </div>
      </div>
      <div className="comment-body">
        <p>{comment.content}</p>
      </div>
      <div className="comment-actions">
        <button 
          type="button"
          className="reaction-btn small" 
          onClick={() => onLikeComment(comment._id)}
        >
          ❤️ {Array.isArray(comment.likes) ? comment.likes.length : 0}
        </button>
        <button 
          type="button"
          className="btn btn-outline small tiny" 
          onClick={() => { setReplyingTo(comment); document.querySelector('.comment-input')?.focus(); }}
        >
          💬 Trả lời
        </button>
        {canDelete && (
          <button 
            type="button"
            className="btn btn-outline small tiny" 
            onClick={() => onDeleteComment(comment._id)}
            style={{ borderColor: 'transparent', color: 'var(--danger)', padding: '4px' }}
          >
            🗑 Xóa
          </button>
        )}
      </div>
    </div>
    
    {/* Render đệ quy các comment con (nếu có) */}
    {comment.replies && comment.replies.length > 0 && (
      <div className="comment-replies">
        {comment.replies.map((reply) => (
          <CommentNode 
            key={reply._id} 
            comment={reply} 
            setReplyingTo={setReplyingTo} 
            onLikeComment={onLikeComment} 
            currentUser={currentUser}
            onDeleteComment={onDeleteComment}
          />
        ))}
      </div>
    )}
  </div>
  );
};

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [msg, setMsg] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const [relatedPosts, setRelatedPosts] = useState([]);
  
  const { user, isAuthenticated } = useAuth();

  const isPostOwner = user?._id === post?.author?._id;
  const isAdmin = user?.role?.name === 'admin';
  const canDeletePost = isPostOwner || isAdmin;

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);
  
  const fetchData = async () => {
    try {
      setMsg('');
      const [{ data: postRes }, { data: commentRes }] = await Promise.all([
        http.get(`/posts/${id}`),
        http.get('/comments', { params: { postId: id } }),
      ]);
      const fetchedPost = postRes?.data || postRes;
      setPost(fetchedPost);
      setComments(commentRes?.data?.items || commentRes?.data || []);

      if (fetchedPost?.subject) {
         http.get('/posts', { params: { subject: fetchedPost.subject, limit: 3 } })
          .then(res => {
             const allRelated = res.data?.data?.items || res.data?.data || [];
             setRelatedPosts(allRelated.filter(p => p._id !== id).slice(0, 3));
          })
          .catch(() => {});
      }
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Không tải được chi tiết bài đăng');
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onLike = async () => {
    if (!isAuthenticated) {
      setMsg('Vui lòng đăng nhập để thả tim!');
      return;
    }
    try {
      await http.post(`/posts/${id}/like`);
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Like thất bại');
    }
  };

  const onComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setMsg('Vui lòng đăng nhập để bình luận!');
      return;
    }
    try {
      await http.post('/comments', { post: id, content, parentComment: replyingTo?._id || null });
      setContent('');
      setReplyingTo(null);
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Gửi bình luận thất bại');
    }
  };

  const onLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      setMsg('Vui lòng đăng nhập để thả tim!');
      return;
    }
    try {
      await http.post(`/comments/${commentId}/like`);
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Like bình luận thất bại');
    }
  };

  const onDeletePost = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await http.delete(`/posts/${id}`);
      navigate('/');
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Xóa bài viết thất bại');
    }
  };

  const onDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;
    try {
      await http.delete(`/comments/${commentId}`);
      fetchData();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Xóa bình luận thất bại');
    }
  };

  return (
    <div className="post-detail-container fade-in">
      <div className="post-main-content card">
        <div className="post-header-detail" style={{ position: 'relative' }}>
          {post?.group && (
            <div style={{ marginBottom: '20px' }}>
              <Link to={`/groups/${post.group._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-light)', color: 'var(--primary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border)' }}>
                <span>⬅️</span>
                <span>Bài viết này thuộc nhóm: {post.group.name}</span>
              </Link>
            </div>
          )}
          <div className="post-author-info">
            <img 
              src={`https://ui-avatars.com/api/?name=${post?.author?.username || 'Unknown'}&background=random`} 
              alt="Author" 
              className="post-author-avatar"
            />
            <div>
              <h1 className="post-title">{post?.title || `Bài viết #${id}`}</h1>
              <div className="post-meta">
                <span className="author-name">{post?.author?.username || 'Unknown'}</span>
                <span className="dot-separator">•</span>
                <span className="post-subject">{post?.subject || 'Chung'}</span>
                <span className="dot-separator">•</span>
                <span className="post-time">{new Date(post?.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
          {canDeletePost && (
            <button 
              onClick={onDeletePost}
              className="btn btn-outline small"
              style={{ position: 'absolute', top: '32px', right: '32px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              🗑 Xóa bài
            </button>
          )}
        </div>

        <div className="post-body">
          {post?.image && (
            <div className="post-featured-image">
              <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${post.image.replace(/\\/g, '/')}`} alt="Featured" />
            </div>
          )}
          <div className="post-content-detail">
            <div className="post-tags">
              {(post?.tags || []).slice(0, 5).map((tag, i) => (
                <span key={i} className="tag">{`#${String(tag).replace(/^#/, '')}`}</span>
              ))}
            </div>
            <div className="post-text" dangerouslySetInnerHTML={{ __html: post?.content || 'Không có nội dung' }} />
          </div>
        </div>

        <div className="post-actions">
          <div className="reactions-bar">
            <button className={`reaction-btn-modern ${(post?.likes || []).map(l => String(typeof l === 'string' ? l : l?._id)).includes(String(user?._id)) ? 'liked' : ''}`} onClick={onLike}>
              <span className="reaction-emoji">❤️</span>
              {Array.isArray(post?.likes) ? post.likes.length : 0} Lượt thích
            </button>
          </div>
        </div>

        <div className="comments-section">
          <h3 className="section-title">💬 Bình luận ({comments.length})</h3>
          
          <form onSubmit={onComment} className="comment-form">
            {replyingTo && (
              <div style={{ marginBottom: '8px', fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔄 Đang trả lời <strong>{replyingTo.author?.username}</strong></span>
                <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }}>✕ Hủy</button>
              </div>
            )}
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="Viết bình luận của bạn... (Ctrl+Enter để gửi)"
              rows="3"
              className="input comment-input"
            />
            <button type="submit" className="btn btn-primary btn-modern comment-submit">
              📤 Gửi bình luận
            </button>
          </form>

          <div className="comments-list">
            {commentTree.length > 0 ? (
              commentTree.map((c) => (
                <CommentNode 
                  key={c._id} 
                  comment={c} 
                  setReplyingTo={setReplyingTo} 
                  onLikeComment={onLikeComment} 
                  currentUser={user}
                  onDeleteComment={onDeleteComment}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💭</div>
                <p className="muted large">Chưa có bình luận nào</p>
                <p className="muted">Hãy là người đầu tiên bình luận!</p>
              </div>
            )}
          </div>
        </div>

        {msg && (
          <div className={`post-msg ${msg.includes('thất bại') ? 'error' : 'success'}`}>
            {msg}
          </div>
        )}
      </div>

      <aside className="post-sidebar">
        <div className="card related-section">
          <h4 className="section-title small" style={{ marginBottom: '16px' }}>🔥 Bài viết liên quan</h4>
          <div className="list" style={{ gap: '12px' }}>
            {relatedPosts.length > 0 ? (
              relatedPosts.map(rp => (
                <div key={rp._id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-light)' }}>
                  <Link to={`/posts/${rp._id}`} style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '8px', fontSize: '0.95rem' }}>{rp.title}</Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <img src={`https://ui-avatars.com/api/?name=${rp.author?.username || 'Unknown'}&background=random`} alt="Avatar" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                    <span className="muted small">{rp.author?.username || 'Người dùng ẩn danh'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-light)' }}>
                <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>Không có bài viết liên quan</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
