"use client";
import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-tsx';

type Initial = { title?: string; description?: string; tags?: string; category?: string; content?: string };

export default function NewPostForm({ defaultCategory = 'GENERAL', initial, editSlug }: { defaultCategory?: string; initial?: Initial; editSlug?: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const DRAFT_KEY = 'newPost:draft:v1';
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  // load draft on mount
  useEffect(() => {
    // seed from initial if provided
    if (initial) {
      setTitle(initial.title || '');
      setDescription(initial.description || '');
      setTags(initial.tags || '');
      setCategory(initial.category || defaultCategory);
      setContent(initial.content || '');
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        // prefer draft values when present
        setTitle(d.title ?? (initial?.title || ''));
        setDescription(d.description ?? (initial?.description || ''));
        setTags(d.tags ?? (initial?.tags || ''));
        setCategory(d.category ?? (initial?.category || defaultCategory));
        setContent(d.content ?? (initial?.content || ''));
        setSavedAt(d.savedAt || null);
      }
    } catch (e) {
      // ignore
    }
  }, [defaultCategory, initial]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  function validate() {
    if (!title.trim()) return '제목을 입력하세요.';
    if (!content.trim()) return '내용을 입력하세요.';
    if (description.length > 150) return '설명은 150자 이내로 제한됩니다.';
    return null;
  }

  function scheduleSave() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    // debounce save
    saveTimer.current = window.setTimeout(() => {
      try {
        const payload = { title, description, tags, category, content, savedAt: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setSavedAt(payload.savedAt);
      } catch (e) {
        // ignore
      }
    }, 600);
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setSavedAt(null);
    } catch (e) {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      const body = { title, description, tags: tags.split(/[ ,\s]+/).filter(Boolean).slice(0,8), category, content };
      const url = editSlug ? `/api/posts/${encodeURIComponent(editSlug)}` : '/api/posts';
      const method = editSlug ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
      if (res.status === 201) {
        const json = await res.json();
        const slug = json.slug || json.id;
  // clear draft on successful publish
  clearDraft();
        window.location.assign(`/post/${slug}`);
        return;
      }
      if (res.status === 200) {
        const json = await res.json();
        clearDraft();
        const slug = json.slug || editSlug;
        window.location.assign(`/post/${slug}`);
        return;
      }
      if (res.status === 401) return setError('로그인이 필요합니다. 로그인 페이지로 이동합니다.'), window.location.assign('/login');
      if (res.status === 403) return setError('이메일 인증이 필요합니다. 프로필에서 확인하세요.'), window.location.assign('/profile');
      const text = await res.text();
      setError(text || `오류 발생: ${res.status}`);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'same-origin' });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      if (j.url) {
        // insert markdown image at cursor end
        setContent(c => `${c}\n![](${j.url})\n`);
        scheduleSave();
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setUploading(false);
    }
  }
  // compute highlighted HTML when preview is active
  const highlighted = showPreview ? Prism.highlight(String(marked.parse(content || '')), Prism.languages.markdown as any, 'markdown') : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error ? <div className="p-3 bg-red-50 border text-red-800 rounded">{error}</div> : null}
      <h1 className="text-xl font-semibold">새 글 작성</h1>
      <div>
        <label className="block text-sm font-medium">제목</label>
        <input value={title} onChange={e => { setTitle(e.target.value); scheduleSave(); }} name="title" required className="mt-1 w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">카테고리</label>
        <select value={category} onChange={e => { setCategory(e.target.value); scheduleSave(); }} name="category" className="mt-1 w-full border rounded px-3 py-2">
          <option value="CREDIT_CARD">신용카드현금화정보</option>
          <option value="MOBILE_CHARGE">휴대폰결제 정보</option>
          <option value="LOAN">대출정보</option>
          <option value="SCAM">사기공유</option>
          <option value="GENERAL">기타</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">설명 (메타디스크립션)</label>
        <input value={description} onChange={e => { setDescription(e.target.value); scheduleSave(); }} name="description" maxLength={150} className="mt-1 w-full border rounded px-3 py-2" />
        <p className="text-xs text-slate-500">최대 150자</p>
      </div>
      <div>
        <label className="block text-sm font-medium">태그 (쉼표 또는 공백 구분)</label>
        <input value={tags} onChange={e => { setTags(e.target.value); scheduleSave(); }} name="tags" className="mt-1 w-full border rounded px-3 py-2" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">내용</label>
          <div className="flex items-center gap-2">
            <label className="text-sm">
              <input type="file" accept="image/*" onChange={e => { handleUpload(e.target.files?.[0] ?? null); }} />
            </label>
            <button type="button" onClick={() => setShowPreview(v => !v)} className="text-sm px-2 py-1 border rounded">{showPreview ? '편집' : '미리보기'}</button>
          </div>
        </div>
        {!showPreview ? (
          <textarea value={content} onChange={e => { setContent(e.target.value); scheduleSave(); }} name="content" required rows={12} className="mt-1 w-full border rounded px-3 py-2" />
        ) : (
          <div className="prose mt-2 max-w-none border p-3 rounded" dangerouslySetInnerHTML={{ __html: highlighted }} />
        )}
        {uploading ? <div className="text-sm text-slate-500">이미지 업로드 중...</div> : null}
      </div>
      <div className="flex items-center gap-4">
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? '전송중...' : '저장'}</button>
        <div className="text-sm text-slate-500">
          {savedAt ? `초안 저장됨 ${new Date(savedAt as number).toLocaleString()}` : '초안 없음'}
        </div>
        {savedAt ? <button type="button" onClick={clearDraft} className="text-sm text-red-600 underline">초안 삭제</button> : null}
      </div>
    </form>
  );
}
