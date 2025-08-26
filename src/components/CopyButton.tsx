"use client";
import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('copy failed', e);
    }
  }

  return (
    <button onClick={onClick} className="underline px-2 py-1 bg-slate-100 rounded">
      {copied ? '복사됨' : 'URL 복사'}
    </button>
  );
}
