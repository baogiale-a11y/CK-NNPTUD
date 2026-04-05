import { useState } from 'react';

export default function CreatePostPage() {
  const [form, setForm] = useState({ title: '', content: '' });

  const onSubmit = (e) => {
    e.preventDefault();
    alert(`Draft post: ${form.title}`);
  };

  return (
    <div className="card">
      <h2>Create Post</h2>
      <form onSubmit={onSubmit}>
        <label>Title</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>Content</label>
        <textarea rows="5" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
