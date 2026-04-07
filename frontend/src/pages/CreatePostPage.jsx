import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SUBJECTS = ['Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Anh'];
const TRENDING = ['#onthi', '#giaitich', '#hoahoc', '#ielts', '#baitap'];

export default function CreatePostPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get('group');

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Toán',
    hashtags: '#onthi,#giaitich',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (groupId) {
      http.get(`/groups/${groupId}`).then(res => {
        setGroupInfo(res.data?.data || res.data);
      }).catch(err => {
        console.error('Lỗi khi lấy thông tin nhóm:', err);
      });
    }
  }, [groupId]);

  const hashtagsPreview = useMemo(
    () =>
      form.hashtags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    [form.hashtags]
  );

  const modules = {
    toolbar: [
      ['bold', 'italic', 'code-block']
    ],
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMsg('');
      const tags = form.hashtags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      
      const payload = {
        title: form.title,
        content: form.content,
        subject: form.category,
        tags
      };

      if (groupId) {
        payload.group = groupId;
      }
      
      const { data } = await http.post('/posts', payload);
      
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate(`/posts/${data.data._id}`);
      }
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Đăng bài thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-2 fade-in">
      <section className="card">
        <h2 className="section-title">
          Create Learning Post
          {groupInfo && <span className="tag" style={{ marginLeft: '12px' }}>Đăng vào nhóm: {groupInfo.name}</span>}
        </h2>

        <form onSubmit={onSubmit}>
          <label>Tiêu đề</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ví dụ: Cần giúp bài tích phân từng phần"
            required
            disabled={loading}
          />

          <div className="form-row">
            <div>
              <label>Môn học (category/subject)</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                disabled={loading}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Hashtags (phân tách bằng dấu phẩy)</label>
              <input
                className="input"
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                placeholder="#onthi,#toan12"
                disabled={loading}
              />
            </div>
          </div>

          <label>Nội dung (rich text giản lược)</label>
          <ReactQuill 
            theme="snow"
            value={form.content}
            onChange={(content) => setForm({ ...form, content })}
            modules={modules}
            readOnly={loading}
            className="quill-editor"
            placeholder="Mô tả câu hỏi/bài học của bạn..."
          />

          <div style={{ marginTop: 14 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          </div>

          {msg && <div className={`form-message ${msg.includes('thất bại') ? 'error' : 'success'}`}>{msg}</div>}
        </form>
      </section>

      <aside className="card">
        <h3 className="section-title">Trending Hashtags</h3>
        <div className="tag-list">
          {TRENDING.map((t) => (
            <button
              type="button"
              key={t}
              className="tag"
              onClick={() => setForm((prev) => ({ ...prev, hashtags: `${prev.hashtags},${t}`.replace(/^,/, '') }))}
            >
              {t}
            </button>
          ))}
        </div>

        <h3 className="section-title" style={{ marginTop: 16 }}>Preview Tags</h3>
        <div>
          {hashtagsPreview.length ? (
            hashtagsPreview.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))
          ) : (
            <p className="muted small">Chưa có hashtag</p>
          )}
        </div>
      </aside>
    </div>
  );
}
