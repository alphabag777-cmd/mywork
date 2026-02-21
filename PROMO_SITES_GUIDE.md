# 🏢 독립 사업 홍보사이트 시스템 가이드

## 📐 전체 아키텍처

```
webapp/
├── mywork/                 ← 기존 AlphaBag 메인 플랫폼 (독립 repo)
│
├── promo-template/         ← 🔷 홍보사이트 공통 템플릿 (원본)
│   ├── src/
│   │   ├── site.config.ts  ← ✏️ 사업 내용 (이것만 수정!)
│   │   ├── lib/firebase.ts ← Firebase (.env.local)
│   │   └── components/     ← 공통 UI
│   └── package.json
│
├── bbag-promo/             ← 🟣 BBAG 토큰 홍보사이트 (독립 repo)
│   ├── .env.local          ← Firebase Project: bbag-firebase-xxx
│   └── src/site.config.ts  ← BBAG 전용 설정
│
├── node-promo/             ← 🟢 노드 사업 홍보사이트 (독립 repo)
│   ├── .env.local          ← Firebase Project: node-firebase-xxx
│   └── src/site.config.ts  ← 노드 전용 설정
│
└── scripts/
    └── new-promo-site.sh   ← 🚀 새 사이트 자동 생성 스크립트
```

---

## 🔑 핵심 원칙

| 항목 | 내용 |
|---|---|
| **코드 격리** | 각 사업 사이트는 독립 폴더 + 독립 GitHub repo |
| **DB 격리** | 사업마다 별도 Firebase 프로젝트 → 완전 독립 Firestore |
| **설정 단순화** | `site.config.ts` 하나만 수정하면 전체 사이트 변경 |
| **브랜드 독립** | 사업별 색상/로고/슬로건 완전 분리 |

---

## 🚀 새 사업 홍보사이트 만들기

### Step 1: 사이트 생성 (자동)
```bash
cd /home/user/webapp
bash scripts/new-promo-site.sh 내사업명-promo
```

### Step 2: 사업 내용 입력
```bash
# 생성된 폴더에서
nano 내사업명-promo/src/site.config.ts
```

수정할 항목:
- `name` — 사업명
- `tagline` — 슬로건
- `colors` — 브랜드 색상 (hex)
- `hero` — Hero 섹션 문구
- `stats` — 핵심 통계
- `features` — 특징 4개
- `services` — 서비스/플랜
- `about` — 회사 소개
- `contact` — 연락처

### Step 3: Firebase 신규 프로젝트 생성
1. https://console.firebase.google.com → **프로젝트 추가**
2. **Firestore Database** 활성화
3. 웹앱 추가 → SDK 설정값 복사
4. `.env.local` 파일에 붙여넣기:

```bash
cp 내사업명-promo/.env.example 내사업명-promo/.env.local
# .env.local 파일에 Firebase 설정값 입력
```

### Step 4: GitHub repo 생성 & 연결
```bash
# GitHub에서 새 repo 생성 (예: alphabag777-cmd/bbag-promo)
cd 내사업명-promo
git remote add origin https://github.com/alphabag777-cmd/내사업명-promo.git
git push -u origin main
```

### Step 5: Netlify/Vercel 배포
**Netlify:**
1. https://netlify.com → **Add new site** → Import from Git
2. GitHub repo 선택
3. Build command: `npm run build`
4. Publish directory: `dist`
5. **Environment variables** 탭에서 `.env.local` 내용 전부 입력
6. **Deploy site** 클릭!

---

## 🔥 Firebase 컬렉션 구조

각 사업의 Firebase 프로젝트에는 다음 컬렉션을 생성합니다:

```
Firestore
├── notices/               ← 공지사항
│   ├── title: string
│   ├── content: string
│   ├── important: boolean
│   └── createdAt: timestamp
│
└── inquiries/             ← 문의 접수
    ├── name: string
    ├── email: string
    ├── phone: string
    ├── message: string
    └── createdAt: timestamp
```

> 컬렉션 이름은 `site.config.ts`의 `inquiryCollection`, `noticeCollection`에서 변경 가능합니다.

---

## 🎨 브랜드 색상 가이드

`site.config.ts`의 `colors` 객체에서 사업별 색상을 설정합니다:

| 사업 유형 | 추천 색상 | primary500 |
|---|---|---|
| 금융/투자/토큰 | 파란색 계열 | `#3b82f6` |
| 블록체인/기술 | 보라색 계열 | `#a855f7` |
| 노드/인프라 | 초록색 계열 | `#22c55e` |
| 에너지/열정 | 빨간색 계열 | `#ef4444` |
| 프리미엄/럭셔리 | 금색 계열 | `#f59e0b` |
| 신뢰/안정 | 남색 계열 | `#1d4ed8` |

---

## 📊 구현된 사이트 예시

### 🟣 BBAG Token (`bbag-promo/`)
- Firebase: 별도 프로젝트 (보라색 테마)
- DB: `bbag_inquiries`, `bbag_notices`

### 🟢 AlphaBag Node (`node-promo/`)  
- Firebase: 별도 프로젝트 (초록색 테마)
- DB: `node_inquiries`, `node_notices`

---

## 🌐 사이트 구성 섹션

모든 홍보사이트는 동일한 섹션 구조를 가집니다:

1. **Navbar** — 고정 상단 네비게이션, 활성 섹션 표시
2. **Hero** — 풀스크린 히어로, 통계 카드
3. **Features** — 4가지 핵심 특징
4. **Services** — 3단계 서비스/플랜 (중간 추천 강조)
5. **About** — 회사/팀 소개
6. **Notice** — Firebase 공지사항 (실시간)
7. **Contact** — 문의 양식 (Firebase 저장) + 연락처
8. **Footer** — 브랜드, 링크

---

## 🔧 로컬 개발

```bash
cd bbag-promo   # 또는 node-promo
npm install
npm run dev     # http://localhost:5173
```
