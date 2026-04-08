import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SUBJECTS = ['Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Anh', 'Tin', 'Sử', 'Địa'];
const TRENDING = ['#onthi', '#giaitich', '#hoahoc', '#ielts', '#baitap'];

export default function CreatePostPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get('group');

  const [form, setForm] = useState({
    title: '',
    content: '',
    subject: 'Toán',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);

  // File upload state
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (groupId) {
      http.get(`/groups/${groupId}`).then(res => {
        setGroupInfo(res.data?.data || res.data);
      }).catch(err => {
        console.error('Lỗi khi lấy thông tin nhóm:', err);
        setMsg('Không tìm thấy nhóm');
      });
    }
  }, [groupId]);

  const hashtagsPreview = useMemo(() =>
    form.tags
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
    [form.tags]
  );

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

const handleFileChange = useCallback((e) => {
    const newFiles = Array.from(e.target.files);
    console.log('Selected files:', newFiles);
    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      console.log('Updated files state:', updated);
      return updated;
    });
  }, []);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = useCallback(async () => {
    console.log('=== UPLOAD CLICKED ===');
    console.log('Current files state:', files);
    console.log('User:', user);
    if (!files.length) {
      console.log('No files to upload');
      setMsg('No files selected');
      return;
    }
    
    const uploadQueue = files.map(async (file, index) => {
      console.log('=== UPLOADING', index, file.name, '===');
      const formData = new FormData();
      formData.append('file', file);
      console.log('FormData created');
      
      try {
        console.log('Calling http.post /uploads');
        const res = await http.post('/uploads', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: localStorage.getItem('accessToken') ? `Bearer ${localStorage.getItem('accessToken')}` : 'No token'
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total || 0);
            console.log(`Progress ${file.name}: ${percent}%`);
          }
        });
        
        console.log('Upload success:', res.data);
        setUploadedFiles(prev => [...prev, res.data.data || res.data]);
        setFiles(prev => prev.filter((_, i) => i !== index));
      } catch (err) {
        console.error('❌ Upload ERROR', file.name, err.response?.status, err.response?.data);
        alert(`Upload ${file.name} failed: ${err.response?.data?.message || err.message}`);
        setFiles(prev => prev.filter((_, i) => i !== index));
      }
    });

    console.log('Waiting for all uploads...');
    await Promise.all(uploadQueue);
    console.log('=== ALL UPLOADS DONE ===');
  }, [files, user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (uploadingFiles.length > 0) {
      setMsg('Đợi upload hoàn tất');
      return;
    }

    try {
      setLoading(true);
      setMsg('');

      const payload = {
        title: form.title,
        content: form.content,
        subject: form.subject,
        tags: hashtagsPreview,
        files: uploadedFiles.map(f => f._id)
      };

      if (groupId) payload.group = groupId;
      
      const { data } = await http.post('/posts', payload);
      
      setForm({ title: '', content: '', subject: 'Toán', tags: '' });
      setFiles([]);
      setUploadedFiles([]);
      
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate(`/posts/${data.data._id || data._id}`);
      }
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Đăng bài thất bại');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc')) return '📝';
    return '📎';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
      <main className="lg:col-span-2">
        <div className="card p-8">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            Tạo bài viết mới
            {groupInfo && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                📚 {groupInfo.name}
              </span>
            )}
          </h2>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tiêu đề bài viết</label>
              <input
                className="input w-full"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nhập tiêu đề bài viết (tối đa 200 ký tự)..."
                required
                disabled={loading}
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Môn học</label>
                <select
                  className="input w-full"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  disabled={loading}
                >
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hashtags (cách nhau bởi dấu phẩy)</label>
                <input
                  className="input w-full"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="#toan,#giaitich,#onthi"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nội dung bài viết</label>
              <div className="quill-container">
                <ReactQuill 
                  theme="snow"
                  value={form.content}
                  onChange={(content) => setForm({ ...form, content })}
                  modules={modules}
                  readOnly={loading}
                  placeholder="Viết nội dung bài học, câu hỏi cần giải đáp..."
                  className="h-64"
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium mb-4">Đính kèm tài liệu (Hình ảnh, PDF, Word...)</label>
              <div 
                className="upload-zone border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-all"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileChange({ target: { files: e.dataTransfer.files } });
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-4">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-lg font-medium mb-1">Kéo thả hoặc click để chọn file</p>
                  <p className="text-muted text-sm">Hỗ trợ: JPG, PNG, PDF, DOCX (tối đa 15MB/file)</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  disabled={loading}
                />
              </div>

              {/* Files List */}
              {(files.length || uploadingFiles.length || uploadedFiles.length) > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    File đính kèm ({uploadedFiles.length}/{files.length})
                  </h4>
                  
                  {files.map((file, index) => (
                    <div key={index} className="file-item flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFileIcon(file.type)}</span>
                        <div>
                          <div className="font-medium truncate max-w-xs">{file.name}</div>
                          <div className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadingFiles.some(f => f.index === index) && (
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${uploadingFiles.find(f => f.index === index)?.progress || 0}%` }}
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {uploadedFiles.map((upload, index) => (
                    <div key={upload._id} className="file-item flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"></span>
                        <div>
                          <div className="font-medium">{upload.originalName}</div>
                          <div className="text-xs text-muted">Đã upload: {upload.path}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFiles(prev => prev.filter(f => f._id !== upload._id));
                        }}
                        className="text-orange-500 hover:text-orange-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <button
                  type="button"
                  onClick={uploadFiles}
                  className="btn btn-outline mt-4 w-full"
                  disabled={uploadingFiles.length > 0 || loading}
                >
                  {uploadingFiles.length > 0 ? 'Đang upload...' : 'Upload Files'}
                </button>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full py-3 text-lg font-semibold"
              disabled={loading || uploadingFiles.length > 0}
            >
              {loading ? 'Đang đăng bài...' : 'Đăng bài viết'}
            </button>

            {msg && (
              <div className={`p-4 rounded-xl mt-4 ${
                msg.includes('thất bại') || msg.includes('Lỗi') 
                  ? 'bg-red-50 border border-red-200 text-red-800' 
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                {msg}
              </div>
            )}
          </form>
        </div>
      </main>

      <aside className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4">Hashtags phổ biến</h3>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map(tag => (
              <button
                key={tag}
                type="button"
                className="tag px-3 py-1"
                onClick={() => setForm(prev => ({ 
                  ...prev, 
                  tags: prev.tags ? `${prev.tags},${tag}`.replace(/^,/, '') : tag 
                }))}
              >
                {tag}
              </button>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-2">Preview tags</h4>
            <div className="flex flex-wrap gap-2">
              {hashtagsPreview.map(tag => (
                <span key={tag} className="tag bg-primary text-white px-2 py-1 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {groupInfo && (
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-4">Nhóm: {groupInfo.name}</h3>
            <p className="text-muted mb-4">{groupInfo.description || 'Không có mô tả'}</p>
            <div className="flex gap-2">
              <span className="text-sm text-muted">Thành viên: {groupInfo.members?.length || 0}</span>
            </div>
          </div>
        )}
      </aside>

      <style jsx>{`
        .upload-zone {
          border-color: var(--border);
          background: var(--bg-light);
          transition: all 0.2s;
        }
        .upload-zone:hover {
          border-color: var(--primary);
          background: rgba(var(--primary-rgb), 0.05);
        }
        .upload-zone.drag-over {
          border-color: var(--primary);
          background: rgba(var(--primary-rgb), 0.1);
        }
        .quill-container :global(.ql-container) {
          border-radius: var(--radius-md);
        }
        .file-item {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

