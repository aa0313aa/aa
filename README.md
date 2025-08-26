# SEO Board

검색 엔진 최적화(SEO)에 집중한 가벼운 게시판 예제.

## 주요 특징
- Next.js 14 App Router / ISR
- Prisma + SQLite (간단 시작, 나중에 PostgreSQL 전환 용이)
- 구조화 데이터(JSON-LD Article) & Open Graph / Twitter 메타
- sitemap.xml / robots.txt / rss.xml 자동
- Canonical URL / 슬러그 / 태그
- 간단한 검색 (제목/본문/태그 contains)

## 빠른 시작

1. 의존성 설치
```powershell
npm install
```
2. DB 마이그레이션 (초기)
```powershell
npx prisma migrate dev --name init
```
3. 개발 서버
```powershell
npm run dev
```
4. 접속: http://localhost:3000

## 환경 변수
`.env` 파일 생성:
```
DATABASE_URL="file:./dev.db"
SITE_URL="http://localhost:3000"
```

### 이메일 설정 (선택)

개발 환경에서는 별도 SMTP 설정 없이도 Ethereal 테스트 계정으로 메일 미리보기를 제공합니다. 프로덕션에서 실제 메일을 보내려면 다음 환경변수를 설정하세요:

```
# SMTP 설정 예시
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false  # true for 465
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM="no-reply@yourdomain.com"
```

설정 후, 가입 또는 비밀번호 재설정 요청을 트리거하면 서버 콘솔에 Ethereal 미리보기 URL 또는 실제 메일 전송 로그가 출력됩니다.

개발에서 이메일 테스트 방법:

1. 개발 서버를 실행합니다: `npm run dev`
2. 브라우저에서 `/signup` 또는 `/reset/request`를 사용해 이메일을 제출합니다.
3. 서버 터미널(또는 DevTools 로그)에 `[MAIL] preview URL:` 로그가 출력되면 브라우저로 미리보기 URL을 열어 메일 내용을 확인하세요.

## CI / Internal E2E

프로젝트에는 네트워크-독립적인 내부 E2E 스크립트가 포함되어 있습니다. 이 스크립트는 Prisma를 통해 DB에 직접 접근해 핵심 흐름(회원 생성 -> 이메일 검증 필드 설정 -> 게시글 생성)을 검증합니다. 로컬 네트워크 문제로 HTTP 기반 테스트가 실패할 때 유용합니다.

로컬 실행:

```powershell
npm run test:e2e-internal
```

GitHub Actions 워크플로(`.github/workflows/e2e-internal.yml`)가 포함되어 있어 Push/PR 시 자동으로 실행됩니다.

## 프로덕션 메일 권장 설정

실제 운영에서는 SMTP 제공업체(SendGrid, Mailgun, Postmark, SES 등) 사용을 권장합니다. 다음 권장사항을 따르세요:

- 발신 도메인에 SPF / DKIM / DMARC 설정
- SMTP 계정은 전용이며, 인증 정보는 GitHub Secrets 또는 배포 플랫폼의 비밀 매니저에 저장
- `EMAIL_FROM`은 발신 도메인과 일치하도록 설정

예시 환경 변수 (`.env.production`):

```
DATABASE_URL="postgresql://user:pass@db-host:5432/prod_db"
SITE_URL="https://yourdomain.com"
JWT_SECRET="<strong-secret>"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
EMAIL_FROM="no-reply@yourdomain.com"
```

CI에서 실행되는 경우 마이그레이션을 적용하려면 워크플로에서 `npx prisma migrate deploy`를 실행하세요.


## 배포시 체크
- SITE_URL 정상 설정
- /sitemap.xml, /robots.txt, /rss.xml 접근 확인
- Lighthouse (Performance/SEO) 90+ 목표

## 개선 아이디어
- Open Graph 이미지 동적 생성 (Edge 함수)
- FTS5 활용한 전문 검색 (SQLite) 또는 Meilisearch
- 사용자 인증 / 권한
- Markdown + 코드 하이라이트
- 캐싱 헤더 세분화

## 라이선스
MIT
