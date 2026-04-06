'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';
import { FiBell, FiX } from 'react-icons/fi';

export default function NoticeBoard() {
  const [notice, setNotice] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/settings/public`)
      .then(res => res.json())
      .then(data => {
        const nb = data?.data?.settings?.noticeBoard;
        if (nb && nb.trim() !== '') {
          setNotice(nb);
        }
      })
      .catch((err) => console.error("NoticeBoard Fetch Error:", err));
  }, []);

  if (!notice || dismissed) return null;

  return (
    <div className="max-w-3xl mx-auto mb-8 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-amber-950 font-bold text-center py-4 px-6 rounded-2xl shadow-[0_4px_20px_rgba(245,158,11,0.35)] z-50 relative animate-fade-in border border-amber-400">
      <div className="flex items-center justify-center gap-3 relative">
        <FiBell className="w-5 h-5 flex-shrink-0 animate-pulse" />
        <span className="text-sm md:text-base tracking-wide flex-1">{notice}</span>
        <button
          onClick={() => setDismissed(true)}
          className="absolute -right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-amber-700/20 rounded-full transition-colors"
          title="Dismiss"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
