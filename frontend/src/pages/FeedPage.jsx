import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const [keyword, setKeyword] = useState('');
  const [subject, setSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [suggestionMsg, setSuggestionMsg] = useState('');
  const [suggestionBusyId, setSuggestionBusyId] = useState(null);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const followingIdSet = useMemo(() => new Set(followingIds), [followingIds]);
  const extractId = (x) => (typeof x === 'string' ? x : x?._id);

  const fetchPosts = async (pageNum = 1, append = false, notifySearch = false) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await http.get('/posts', {
        params: {
          search: keyword || undefined,
          subject: subject !== 'all' ? subject : undefined,
          page: pageNum,
          limit: 10,
          notify: notifySearch ? 1 : undefined,
        },
      });
      const list = data?.data?.items || data?.data || data || [];
      const arr = Array.isArray(list) ? list : [];
      
      if (append) {
        setPosts(prev => [...prev, ...arr]);
      } else {
        setPosts(arr);
      }
      
      setHasMore(arr.length === 10);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;

    const fetchSuggestions = async () => {
      try {
        setSuggestionMsg('');

        const [uRes, gRes, followingRes] = await Promise.all([
          http.get('/users', { params: { limit: 10 } }),
          http.get('/groups', { params: { limit: 10 } }),
          http.get(`/follows/${user._id}/following`),
        ]);

        const uList = uRes.data?.data?.items || uRes.data?.data || [];
        const gList = gRes.data?.data?.items || gRes.data?.data || [];
        const followingList = followingRes.data?.data?.items || followingRes.data?.data || [];

        const ids = (Array.isArray(followingList) ? followingList : [])
          .map((f) => extractId(f?.following))
          .filter(Boolean);
        setFollowingIds(ids);

        const usersArr = Array.isArray(uList) ? uList : [];
        const groupsArr = Array.isArray(gList) ? gList : [];

        const filteredUsers = usersArr.filter((u) => String(u?._id) !== String(user._id));

        setSuggestedUsers(filteredUsers.slice(0, 5));
        setSuggestedGroups(groupsArr.slice(0, 5));
      } catch (err) {
        console.error('Lỗi tải gợi ý:', err);
      }
    };

    fetchSuggestions();
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    fetchPosts();
  }, [keyword, subject]);

  const lastPostRef = useCallback(node => {
    observerRef.current = node;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => p + 1);
      }
    }, { threshold: 1.0 });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore]);

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await fetchPosts(1, false, true);
  };

  useEffect(() => {
    const handlePageChange = async () => {
      if (page > 1) {
        await fetchPosts(page, true);
      }
    };

    handlePageChange();
  }, [page]);

const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để like bài viết!');
      return;
    }
    try {
      const { data } = await http.post(`/posts/${postId}/like`);
      const updatedPost = data?.data || data;
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            ...updatedPost,
            likes: updatedPost.likes || p.likes,
            author: updatedPost.author || p.author
          }
        }
        return p;
      }));
    } catch (err) {
      console.error('Lỗi like:', err);
    }
  };

  const normalizedPosts = useMemo(
    () =>
      posts.map((post) => ({
        _id: post._id,
        title: post.title || 'Không có tiêu đề',
        content: stripHtml(post.content),
        subject: post.subject || post.category || 'General',
        tags: post.tags || [],
        files: post.files || [],
        likes: post.likes || [],

        author: post.author,
        authorName: (post.author?.username || post.author?.name || post.author?.email || 'Unknown'),
        reactions: {
          like: Array.isArray(post.likes) ? post.likes.length : post.likeCount || 0,
        },
      })),

    [posts]
  );

  return (
    <div className="grid grid-2 fade-in">
      <section className="card" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none' }}>
        <div className="hero">
          <h1>Learning Feed</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}>Khám phá kiến thức từ cộng đồng</p>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <form className="feed-filter-form" onSubmit={onSearch}>
            <input
              className="input"
              placeholder="🔍 Tìm bài viết, hashtag, môn học..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="all">Tất cả môn</option>
              <option value="Toán">Toán</option>
              <option value="Lý">Lý</option>
              <option value="Hóa">Hóa</option>
              <option value="Sinh">Sinh</option>
              <option value="Văn">Văn</option>
              <option value="Anh">Anh</option>
            </select>
            <button type="submit" className="btn btn-primary btn-modern">
              <span>Tìm kiếm</span>
            </button>
          </form>
        </div>

        {loading && (
          <div className="list">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton skeleton-post"></div>
            ))}
          </div>
        )}
        {error && <p className="muted pulse" style={{ color: 'var(--danger)', textAlign: 'center', padding: '20px' }}>{error}</p>}

        <div className="list">
          {!loading && !error && normalizedPosts.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3 className="section-title">Chưa có bài đăng nào</h3>
              <p className="muted">Bắt đầu bằng cách tạo bài viết đầu tiên của bạn!</p>
              <Link to="/posts/new" className="btn btn-primary btn-modern" style={{ marginTop: '16px' }}>Tạo bài viết</Link>
            </div>
          )}

          {normalizedPosts.map((post, index) => {
            const ref = index === normalizedPosts.length - 1 ? lastPostRef : null;
            return (
              <article key={post._id} className="post-card fade-in" ref={ref}>
                <div className="post-content" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/posts/${post._id}`)}>
                  <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <img src={`https://ui-avatars.com/api/?name=${post.authorName}&background=random`} alt={post.authorName} className="post-avatar" />
                      <div className="post-header-info">
                        <h4 style={{ margin: 0, fontWeight: 600 }}>
                          {post.authorName !== 'Unknown' ? (
                            <Link to={`/profile/${post.author?._id}`} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-underline">
                              {post.authorName}
                            </Link>
                          ) : 'Người dùng ẩn danh'}
                        </h4>
                        <p className="muted small" style={{ margin: 0, marginTop: '2px' }}>
                          <span className="tag" style={{ padding: '2px 8px', fontSize: '0.75rem', marginRight: '8px' }}>{post.subject}</span>
                          {new Date().toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    {post.author?._id && String(post.author._id) !== String(user?._id) && (
                      <button
                        className="btn btn-outline btn-small fade-in"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/messages?to=${post.author._id}`);
                        }}
                        style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={`Nhắn tin cho ${post.authorName}`}
                      >
                        💬
                      </button>
                    )}
                  </div>

                  <h3 className="section-title" style={{ marginTop: '16px', marginBottom: '8px', fontSize: '1.4rem' }}>
                    {post.title}
                  </h3>
                  <p style={{ color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
                  </p>
                  
                  {post.tags?.length > 0 && (
                    <div className="post-tags">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">
                          #{String(tag).replace(/^#/, '')}
                        </span>
                      ))}
                      {post.tags.length > 3 && <span className="tag muted" style={{ background: 'var(--bg-light)', color: 'var(--text-muted)' }}>+{post.tags.length - 3}</span>}
                    </div>
                  )}
                  
                  {post.files?.length > 0 && (
                    <div className="post-files-preview" style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {post.files.slice(0, 3).map((file, i) => (
                        <a 
                          key={file._id || i}
                          href={`http://localhost:5000${file.path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-preview"
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            padding: '6px 10px', background: 'var(--bg-light)', 
                            borderRadius: '6px', fontSize: '0.8rem', 
                            color: 'var(--text-main)', textDecoration: 'none',
                            border: '1px solid var(--border)', minWidth: '120px' 
                          }}
                          title={file.originalName || file.filename}
                        >
                          {file.mimetype?.startsWith('image/') ? '🖼️' : '📎'}
                          {(file.originalName || file.filename || 'File').substring(0, 15)}{(file.originalName || file.filename || 'File').length > 15 ? '...' : ''}
                        </a>
                      ))}
                      {post.files.length > 3 && (
                        <span className="file-count" style={{ 
                          padding: '6px 10px', background: 'var(--bg-light)', 
                          borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border)' 
                        }}>
                          +{post.files.length - 3} file
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="reactions-bar" style={{ marginTop: '20px' }}>

                    <button className={`reaction-btn btn-modern ${(post?.likes || []).map(l => String(typeof l === 'string' ? l : l?._id)).includes(String(user?._id)) ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); handleLike(post._id); }}>
                      <span className="reaction-emoji">❤️</span>
                      <strong>{Array.isArray(post?.likes) ? post.likes.length : (post.reactions?.like || 0)}</strong>
                    </button>
                    <span className="muted small">lượt thích</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside style={{ position: 'sticky', top: '100px', height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 className="section-title">💡 Gợi ý nhanh</h3>
          <div className="stats-grid" style={{ margin: '16px 0 0 0' }}>
            <div className="stat-item" style={{ padding: '12px' }}>
              <div className="stat-number" style={{ fontSize: '1.5rem' }}>{suggestedUsers.length}</div>
              <span style={{ fontSize: '0.85rem' }}>Gợi ý Follow</span>
            </div>
            <div className="stat-item" style={{ padding: '12px' }}>
              <div className="stat-number" style={{ fontSize: '1.5rem' }}>{suggestedGroups.length}</div>
              <span style={{ fontSize: '0.85rem' }}>Nhóm học</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>👥 Người dùng gợi ý</h3>
            <Link to="/users" className="small" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Xem thêm</Link>
          </div>

          {suggestionMsg && (
            <div className={`form-message ${suggestionMsg.toLowerCase().includes('lỗi') ? 'error' : 'success'}`}>{suggestionMsg}</div>
          )}

          <div className="suggestion-list">
            {suggestedUsers.slice(0, 5).map(u => {
              const isFollowingUser = followingIdSet.has(String(u._id));
              const busy = suggestionBusyId === `follow:${u._id}`;

              return (
                <div key={u._id} className="suggestion-item">
                  <div className="suggestion-info">
                    <img
                      src={`https://ui-avatars.com/api/?name=${u.username}&background=random`}
                      className="suggestion-avatar"
                      alt=""
                    />
                    <Link to={`/profile/${u._id}`} className="suggestion-name">{u.username}</Link>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      title="Nhắn tin"
                      onClick={() => navigate(`/messages?to=${u._id}`)}
                    >
                      💬
                    </button>
                    <button
                      className={`btn ${isFollowingUser ? 'btn-outline' : 'btn-primary'} btn-sm`}
                    disabled={!isAuthenticated || !user?._id || busy}
                    onClick={async () => {
                      if (!isAuthenticated || !user?._id) {
                        setSuggestionMsg('Lỗi: Vui lòng đăng nhập lại');
                        return;
                      }

                      try {
                        setSuggestionBusyId(`follow:${u._id}`);
                        setSuggestionMsg('');

                        if (isFollowingUser) {
                          await http.delete(`/follows/${u._id}`);
                          setFollowingIds((prev) => prev.filter((id) => String(id) !== String(u._id)));
                          setSuggestionMsg('Unfollow thành công');
                        } else {
                          await http.post(`/follows/${u._id}`);
                          setFollowingIds((prev) => Array.from(new Set([...prev, String(u._id)])));
                          setSuggestionMsg('Follow thành công');
                        }
                      } catch (err) {
                        const apiMsg = err?.response?.data?.message || 'Lỗi follow';

                        if (String(apiMsg).toLowerCase().includes('already followed')) {
                          try {
                            await http.delete(`/follows/${u._id}`);
                            setFollowingIds((prev) => prev.filter((id) => String(id) !== String(u._id)));
                            setSuggestionMsg('Unfollow thành công');
                          } catch (err2) {
                            setSuggestionMsg(err2?.response?.data?.message || apiMsg);
                          }
                        } else {
                          setSuggestionMsg(apiMsg);
                        }
                      } finally {
                        setSuggestionBusyId(null);
                      }
                    }}
                    >
                      {busy ? '...' : (isFollowingUser ? 'Unfollow' : 'Follow')}
                    </button>
                  </div>
                </div>
              );
            })}

            {suggestedUsers.length === 0 && <p className="muted small">Chưa có gợi ý</p>}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>🏫 Nhóm học gợi ý</h3>
            <Link to="/groups" className="small" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Xem thêm</Link>
          </div>
          <div className="suggestion-list">
            {suggestedGroups.slice(0, 5).map(g => {
              const members = Array.isArray(g?.members) ? g.members : [];
              const memberIds = members.map(extractId).filter(Boolean).map(String);
              const isMember = user?._id ? memberIds.includes(String(user._id)) : false;
              const busy = suggestionBusyId === `group:${g._id}`;

              return (
                <div key={g._id} className="suggestion-item">
                  <Link to={`/groups/${g._id}`} className="suggestion-name">{g.name}</Link>
                  <button
                    className={`btn ${isMember ? 'btn-outline' : 'btn-primary'} btn-sm`}
                    disabled={!isAuthenticated || !user?._id || busy}
                    onClick={async () => {
                      if (!isAuthenticated || !user?._id) {
                        setSuggestionMsg('Lỗi: Vui lòng đăng nhập lại');
                        return;
                      }

                      try {
                        setSuggestionBusyId(`group:${g._id}`);
                        setSuggestionMsg('');

                        if (isMember) {
                          await http.post(`/groups/${g._id}/leave`);
                          setSuggestedGroups((prev) => prev.map((x) => {
                            if (String(x._id) !== String(g._id)) return x;
                            const curMembers = Array.isArray(x.members) ? x.members : [];
                            return {
                              ...x,
                              members: curMembers.filter((m) => String(extractId(m)) !== String(user._id)),
                            };
                          }));
                          setSuggestionMsg('Rời nhóm thành công');
                        } else {
                          await http.post(`/groups/${g._id}/join`);
                          setSuggestedGroups((prev) => prev.map((x) => {
                            if (String(x._id) !== String(g._id)) return x;
                            const curMembers = Array.isArray(x.members) ? x.members : [];
                            const nextMembers = [...curMembers, { _id: user._id, username: user.username, avatar: user.avatar }];
                            const seen = new Set();
                            return {
                              ...x,
                              members: nextMembers.filter((m) => {
                                const id = String(extractId(m));
                                if (!id || seen.has(id)) return false;
                                seen.add(id);
                                return true;
                              }),
                            };
                          }));
                          setSuggestionMsg('Tham gia nhóm thành công');
                        }
                      } catch (err) {
                        const apiMsg = err?.response?.data?.message || 'Lỗi tham gia nhóm';
                        if (String(apiMsg).toLowerCase().includes('already a member')) {
                          try {
                            await http.post(`/groups/${g._id}/leave`);
                            setSuggestedGroups((prev) => prev.map((x) => {
                              if (String(x._id) !== String(g._id)) return x;
                              const curMembers = Array.isArray(x.members) ? x.members : [];
                              return {
                                ...x,
                                members: curMembers.filter((m) => String(extractId(m)) !== String(user._id)),
                              };
                            }));
                            setSuggestionMsg('Rời nhóm thành công');
                          } catch (err2) {
                            setSuggestionMsg(err2?.response?.data?.message || apiMsg);
                          }
                        } else {
                          setSuggestionMsg(apiMsg);
                        }
                      } finally {
                        setSuggestionBusyId(null);
                      }
                    }}
                  >
                    {busy ? '...' : (isMember ? 'Rời nhóm' : 'Tham gia')}
                  </button>
                </div>
              );
            })}
            {suggestedGroups.length === 0 && <p className="muted small">Chưa có gợi ý</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
