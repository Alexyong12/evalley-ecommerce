'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => api.notifications().then(r => setNotifs(r.data?.notifications || []));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => { await api.markNotification(id); load(); };
  const markAll = async () => { await api.markAllNotifications(); load(); };
  const del = async (id) => { await api.deleteNotification(id); load(); };

  if (!notifs) return <div className="empty">Loading…</div>;
  const shown = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;

  return (
    <div>
      <div className="section-head" style={{ alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        <button className="btn secondary small" onClick={markAll}>Mark all as read</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn small ${filter === 'all' ? '' : 'ghost'}`} onClick={() => setFilter('all')}>All</button>
        <button className={`btn small ${filter === 'unread' ? '' : 'ghost'}`} onClick={() => setFilter('unread')}>Unread</button>
      </div>
      {shown.length === 0 && <div className="empty card"><p>No notifications.</p></div>}
      {shown.map(n => (
        <div className="card" key={n.id} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <strong>{n.title}</strong>
            <span className="chip unpaid">{n.kind}</span>
            {!n.read && <span className="chip unread">Unread</span>}
          </div>
          <p style={{ margin: '6px 0' }}>{n.body}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="muted small">{n.created_at}</span>
            {!n.read && <button className="btn secondary small" onClick={() => markRead(n.id)}>Mark read</button>}
            <button className="btn ghost small" onClick={() => del(n.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
