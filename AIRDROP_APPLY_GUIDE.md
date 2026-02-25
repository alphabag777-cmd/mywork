# 에어드랍 기능 적용 가이드

## 변경된 파일 목록
1. `src/lib/airdrop.ts` - Firestore 에어드랍 데이터 레이어 (신규)
2. `src/pages/Airdrop.tsx` - 사용자 에어드랍 페이지 (신규)
3. `src/pages/admin/AdminAirdrop.tsx` - 관리자 에어드랍 관리 페이지 (신규)
4. `src/App.tsx` - `/airdrop` 라우트 추가
5. `src/components/BottomNav.tsx` - 에어드랍 메뉴 링크 추가
6. `src/components/Header.tsx` - 에어드랍 메뉴 링크 추가
7. `src/pages/admin/AdminUsersOrg.tsx` - Airdrop 탭 추가

## 적용 방법

### 방법 1: git pull (권장)
```bash
# genspark_ai_developer 브랜치 병합
git fetch
git checkout genspark_ai_developer
git pull
git checkout develop
git merge genspark_ai_developer
npm run build
```

### 방법 2: 패치 파일 적용
```bash
git apply airdrop_only.patch
npm run build
```
