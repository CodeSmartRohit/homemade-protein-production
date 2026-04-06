'use client';
import { useState, useEffect } from 'react';

export default function NoticeBoard() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    // Dynamic client-side fetch to bypass Next.js aggressive SSR caching
    fetch('http://localhost:5000/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data?.data?.settings?.noticeBoard) {
          setNotice(data.data.settings.noticeBoard);
        }
      })
      .catch((err) => console.error("NoticeBoard Fetch Error:", err));
  }, []);

  if (!notice) return null;

  return (
    <div className="bg-amber-500 text-amber-950 font-bold text-center py-3 px-4 shadow-[0_0_15px_rgba(245,158,11,0.3)] z-50 relative animate-fade-in border-b border-amber-600">
       📢 {notice}
    </div>
  );
}
