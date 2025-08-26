"use client";
import { useEffect, useState } from 'react';

type Variant = 'success' | 'warning' | 'info';

export default function FlashToast({ message, variant = 'info', ttl = 6000 }: { message: string; variant?: Variant; ttl?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setVisible(false), ttl);
    return () => clearTimeout(t);
  }, [message, ttl]);

  if (!visible || !message) return null;

  async function dismiss() {
    try {
      await fetch('/api/flash', { method: 'POST' });
    } catch (e) {
      // ignore network errors
    }
    setVisible(false);
  }

  const bg = variant === 'success' ? 'bg-green-50 border-green-200 text-green-800' : variant === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-4">
      <div role="status" aria-live="polite" className={`flex items-center justify-between border rounded shadow p-3 transition transform duration-200 ${bg}`}>
        <div className="text-sm">{message}</div>
        <button onClick={dismiss} aria-label="닫기" className="ml-4 text-sm text-slate-500 hover:text-slate-700">닫기</button>
      </div>
    </div>
  );
}
