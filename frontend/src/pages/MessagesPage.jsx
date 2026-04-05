import { useState } from 'react';

export default function MessagesPage() {
  const [text, setText] = useState('');

  const onSend = (e) => {
    e.preventDefault();
    alert(`Send message: ${text}`);
    setText('');
  };

  return (
    <div className="card">
      <h2>Messages</h2>
      <p className="muted">Trang chat real-time (socket sẽ nối ở bước sau).</p>
      <form onSubmit={onSend}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập tin nhắn..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
