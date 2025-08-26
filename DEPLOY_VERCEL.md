# Vercel 배포 가이드 (간단)

이 문서는 이 프로젝트를 Vercel에 배포하는 쉬운 단계와 프로덕션 마이그레이션을 자동화하는 방법을 설명합니다.

1) Vercel에 프로젝트 연결
- Vercel(https://vercel.com)에 로그인 후 GitHub 계정과 연동합니다.
- Vercel Dashboard → "New Project" → Git Repository에서 `aa`를 선택합니다.
- Import를 진행하면 빌드 설정은 기본값(Next.js)이 자동 선택됩니다.

2) 환경변수 설정
- Vercel 프로젝트 Settings → Environment Variables에서 다음 값을 추가하세요:

  - `DATABASE_URL`  (예: postgres://user:pass@host:5432/db)
  - `JWT_SECRET` (강력한 랜덤 문자열)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
  - `NEXT_PUBLIC_BASE_URL` (https://your-deployment-url)

3) 마이그레이션(프로덕션 DB 반영)
- 권장: DB 마이그레이션은 배포 파이프라인에서 자동으로 실행하도록 설정합니다. 이 레포에 포함된 GitHub Actions 워크플로(`.github/workflows/prisma-migrate.yml`)는 `main` 브랜치에 푸시될 때 `npx prisma migrate deploy`를 실행합니다.
- GitHub Actions가 프로덕션 DB에 접근하려면 GitHub Repo Settings → Secrets → Actions에 `DATABASE_URL`(같은 값)을 추가해야 합니다.

4) 배포 확인
- Vercel이 빌드를 완료하면 공개 URL(예: https://aa.vercel.app)에서 사이트가 열립니다.
- 최초 배포 후 관리자로 유저를 만들고 이메일 검증, 글쓰기 등 흐름을 점검하세요.

5) 롤백/마이그레이션 주의
- 마이그레이션은 되돌리기 어려운 작업이 될 수 있으니, 중요한 마이그레이션 전에는 DB 백업을 권장합니다.

문제 발생 시
- Vercel의 Deploy Log와 GitHub Actions의 Workflow 로그를 확인해 오류 원인을 파악하세요.
