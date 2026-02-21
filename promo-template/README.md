# 사업별 홍보사이트 템플릿

## 🏗️ 구조 개요
```
promo-template/          ← 이 폴더 전체를 복사해서 새 사업 사이트 생성
├── src/
│   ├── site.config.ts   ← ✏️ 사업 내용 설정 (이것만 수정!)
│   ├── lib/
│   │   └── firebase.ts  ← Firebase 초기화 (.env.local에서 설정)
│   └── components/      ← 공통 UI 컴포넌트 (수정 불필요)
├── .env.example         ← Firebase 환경변수 예시
└── package.json
```

---

## 🚀 새 사업 홍보사이트 만들기 (3단계)

### 1단계: 폴더 복사 & GitHub 신규 repo 생성
```bash
# scripts/new-promo-site.sh 스크립트 사용
bash scripts/new-promo-site.sh my-new-business
```

### 2단계: `src/site.config.ts` 수정
- `name`, `tagline`, `description` — 사업명/슬로건
- `colors` — 브랜드 색상 (hex 코드)
- `hero` — Hero 섹션 문구
- `stats` — 핵심 통계 수치
- `features` — 특징/장점
- `services` — 서비스/플랜
- `about` — 회사/팀 소개
- `contact` — 연락처

### 3단계: Firebase 신규 프로젝트 연결
1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. Firestore Database 활성화
3. `.env.example` → `.env.local` 복사 후 값 입력
4. 배포 플랫폼(Netlify/Vercel)에 환경변수 등록

---

## 📂 Firebase Firestore 컬렉션 구조

각 사이트마다 독립된 Firebase 프로젝트를 사용하므로 완전 분리됩니다.

```
[Firebase Project: business-A]
  └── Firestore
        ├── notices/          ← 공지사항
        │     ├── title: string
        │     ├── content: string
        │     ├── important: boolean
        │     └── createdAt: timestamp
        └── inquiries/        ← 문의 접수
              ├── name: string
              ├── email: string
              ├── phone: string
              ├── message: string
              └── createdAt: timestamp
```

---

## 🎨 브랜드 색상 예시

| 사업 성격 | primary500 추천 |
|---|---|
| 금융/투자 | `#2563eb` (Blue) |
| 친환경/헬스 | `#16a34a` (Green) |
| 럭셔리/프리미엄 | `#7c3aed` (Purple) |
| 에너지/열정 | `#dc2626` (Red) |
| 골드/신뢰 | `#d97706` (Amber) |

---

## 🌐 배포

### Netlify (추천)
1. GitHub repo 연결
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables: Firebase 설정값 입력

### Vercel
동일하게 설정 후 배포

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build && firebase deploy
```
