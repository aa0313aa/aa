 import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserFromToken } from '../../lib/auth';
import NewPostForm from '../../components/NewPostForm';

export const metadata: Metadata = { title: '새 글 작성' };

export default async function NewPostPage() {
  const token = cookies().get('token')?.value || null;
  const user = await getUserFromToken(token);
  if (!user) {
    // not logged in -> redirect to login
    redirect('/login');
  }

  // If logged in but email not verified, show a notice instead of automatically redirecting
  const emailVerified = Boolean((user as any).emailVerified);

    return (
      <div className="max-w-2xl">
        {!emailVerified ? (
          <div className="p-6 border rounded bg-yellow-50">
            <h2 className="text-lg font-semibold">이메일 확인 필요</h2>
            <p className="mt-2 text-sm text-slate-700">게시물을 작성하려면 가입하신 이메일을 먼저 확인해야 합니다. 확인 메일을 받지 못하셨다면 로그인 후 재발송을 시도하세요.</p>
            <div className="mt-4">
              <a href="/profile" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">프로필에서 확인/재발송</a>
            </div>
          </div>
        ) : (
          <div>
            <NewPostForm defaultCategory="GENERAL" />
          </div>
        )}
      </div>
    );
  }

