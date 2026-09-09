'use client';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="muted" style={{ margin: 0 }}>{message}</p>
        <div className="actions">
          <button className="btn secondary" onClick={onCancel}>Keep it</button>
          <button className={`btn ${danger ? 'danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
