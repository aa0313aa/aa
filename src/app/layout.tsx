import './globals.css';
import type { Metadata } from 'next';
import { absoluteUrl } from '../lib/seo';
import { cookies } from 'next/headers';
import { getUserFromToken } from '../lib/auth';
import { prisma } from '../lib/prisma';
import dynamic from 'next/dynamic';

const FlashToast = dynamic(() => import('../components/FlashToast'), { ssr: false });

export const metadata: Metadata = {
  title: {
    template: '%s | SEO Board',
    default: 'SEO Board'
  },
  description: '검색 최적화 공유 게시판',
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'SEO Board',
    description: '검색 최적화 공유 게시판',
    url: absoluteUrl(),
    siteName: 'SEO Board',
    type: 'website'
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let displayName: string | null = null;
  let isAuth = false;
  let isAdmin = false;
  let unreadCount = 0;
  try {
    const token = cookies().get('token')?.value || null;
    const user = await getUserFromToken(token);
    if (user) {
      isAuth = true;
      displayName = (user.name && user.name.length) ? user.name : user.email;
  isAdmin = !!(user as any).isAdmin;
    }
    // unread messages count for bell notification
    try {
      if (isAuth && (user as any).id) {
        const count = await (prisma as any).message.count({ where: { receiverId: (user as any).id, read: false } });
        // store locally for rendering
        unreadCount = Number(count || 0);
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // treat errors as unauthenticated
    isAuth = false;
    displayName = null;
  }

  // Debug helpers: log prototypes/types to detect non-plain objects being passed to Client Components
  try {
    const DEBUG_LAYOUT = process.env.DEBUG_LAYOUT === 'true';
    if (DEBUG_LAYOUT) {
      // log primitive values
      // eslint-disable-next-line no-console
      console.debug('[LAYOUT DEBUG] isAuth type:', typeof isAuth, 'prototype:', Object.getPrototypeOf(isAuth));
      // eslint-disable-next-line no-console
      console.debug('[LAYOUT DEBUG] displayName type:', typeof displayName, 'prototype:', displayName == null ? null : Object.getPrototypeOf(displayName));

      // children can be complex; try a safe serialize to see if it contains class instances
      const inspectChild = (c: any) => {
        try {
          if (c == null) return null;
          const t = typeof c;
          const proto = Object.getPrototypeOf(c);
          return { typeOf: t, proto: proto && proto.constructor && proto.constructor.name ? proto.constructor.name : String(proto) };
        } catch (err) {
          return { error: String(err) };
        }
      };
      // eslint-disable-next-line no-console
      console.debug('[LAYOUT DEBUG] children inspect:', inspectChild(children));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.debug('[LAYOUT DEBUG] prototype inspect error:', err);
  }

  return (
    <html lang="ko">
      <body className="min-h-screen antialiased text-slate-800 bg-slate-50">
        {/* global flash banner */}
        {(() => {
          try {
            const flash = cookies().get('flash')?.value || null;
            if (!flash) return null;
            const message = flash === 'verify-sent'
              ? '확인 메일을 전송했습니다. 메일함을 확인하세요.'
              : flash === 'need-verify'
                ? '게시물 작성은 이메일 확인이 필요합니다. 프로필에서 메일을 확인하거나 재발송하세요.'
                : null;
            if (!message) return null;
            return <FlashToast message={message} />;
          } catch (e) {
            return null;
          }
        })()}
        <header className="max-w-3xl mx-auto py-6 px-4 flex justify-between items-center">
          <a href="/" className="font-bold text-xl">SEO Board</a>
          <nav className="flex gap-4 text-sm">
            <a href="/new" className="hover:underline">새 글</a>
            <a href="/rss.xml" className="hover:underline">RSS</a>
            {!isAuth ? (
              <>
                <a href="/signup" className="hover:underline">회원가입</a>
                <a href="/login" className="hover:underline">로그인</a>
              </>
            ) : (
              <>
                <a href="/profile" className="hover:underline">프로필</a>
                <a href="/messages" className="hover:underline">쪽지</a>
                {/* bell with unread count */}
                <a href="/messages" className="hover:underline">🔔{unreadCount ? ` (${unreadCount})` : ''}</a>
                <a href="/logout" className="hover:underline">로그아웃</a>
                <span className="text-sm text-slate-600">{displayName}</span>
              </>
            )}
            {isAdmin && (
              <a href="/admin/users" className="hover:underline">관리자</a>
            )}
          </nav>
        </header>
        <main className="max-w-3xl mx-auto px-4 pb-16">{children}</main>
        <footer className="border-t py-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} SEO Board</footer>
      </body>
    </html>
  );
}
