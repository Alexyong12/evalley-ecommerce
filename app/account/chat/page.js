'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function ChatPage() {
  const toast = useToast();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  const load = () => api.chat().then(r => setMessages(r.data?.messages || []));
  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const r = await api.sendChat(text.trim());
    setBusy(false);
    if (!r.ok) { toast(r.data?.error || 'Could not send.', 'error'); return; }
    setText('');
    setMessages(r.data.messages);
  };

  if (!messages) return <div className="empty">Loading…</div>;

  return (
    <div>
      <h1>Chat</h1>
      <p className="muted small">Your conversation with Evalley support. <strong style={{ color: 'var(--good)' }}>We&apos;re online</strong></p>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 2px' }}>
          {messages.length === 0 && (
            <div className="empty"><p>No messages yet. Say hello and our team will reply.</p></div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`msg ${m.sender}`}>
              {m.body}
              <div className={m.sender === 'user' ? 'small' : 'muted small'} style={{ opacity: 0.8, marginTop: 2 }}>
                {m.created_at?.slice(11, 16)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input type="text" placeholder="Type a message" value={text} onChange={e => setText(e.target.value)}
            style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 999, padding: '10px 16px' }} />
          <button className="btn" type="submit" disabled={busy || !text.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}
