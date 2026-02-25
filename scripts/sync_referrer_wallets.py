"""
sync_referrer_wallets.py
=========================
referrals 컬렉션(referrerWallet + referredWallet)을 읽어
users 컬렉션의 각 문서에 referrerWallet 필드를 업데이트합니다.

조직도(OrgChart)는 users.referrerWallet 으로 트리를 빌드하므로
이 동기화 없이는 모든 노드가 root가 됩니다.
"""

import requests, json, time, os

PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "numine-dev-e4ec1")
API_KEY    = os.environ.get("FIREBASE_API_KEY", "")
BASE_URL   = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def run_query(collection, field=None, value=None, page_size=1000, page_token=None):
    url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents:runQuery?key={API_KEY}"
    where_clause = {}
    if field and value:
        where_clause = {
            "fieldFilter": {
                "field": {"fieldPath": field},
                "op": "EQUAL",
                "value": {"stringValue": value}
            }
        }
    body = {
        "structuredQuery": {
            "from": [{"collectionId": collection}],
            **({"where": where_clause} if where_clause else {}),
        }
    }
    r = requests.post(url, json=body, timeout=30)
    return r.json()

def patch_field(collection, doc_id, field, string_value):
    url = f"{BASE_URL}/{collection}/{doc_id}?updateMask.fieldPaths={field}&key={API_KEY}"
    payload = {"fields": {field: {"stringValue": string_value}}}
    r = requests.patch(url, json=payload, timeout=10)
    return r.json()

def get_all_pages(collection):
    """페이지네이션으로 컬렉션 전체 가져오기"""
    docs = []
    url = f"{BASE_URL}/{collection}?pageSize=300&key={API_KEY}"
    while url:
        r = requests.get(url, timeout=30)
        data = r.json()
        for doc in data.get("documents", []):
            doc_id = doc["name"].split("/")[-1]
            fields = {}
            for k, v in doc.get("fields", {}).items():
                val = list(v.values())[0]
                fields[k] = None if val is None else val
            docs.append({"id": doc_id, "fields": fields})
        url = data.get("nextPageToken")
        if url:
            base = f"{BASE_URL}/{collection}?pageSize=300&pageToken={url}&key={API_KEY}"
            url = base
        else:
            break
    return docs

print("=" * 60)
print("Step 1: referrals 컬렉션 전체 로드")
print("=" * 60)

# referrals 컬렉션 전체 가져오기 (runQuery)
url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents:runQuery?key={API_KEY}"
body = {"structuredQuery": {"from": [{"collectionId": "referrals"}]}}
r = requests.post(url, json=body, timeout=30)
referral_docs = r.json()

# referredWallet → referrerWallet 매핑 (중복 시 마지막 값)
referral_map = {}  # referred_wallet → referrer_wallet
dup = 0
for item in referral_docs:
    doc = item.get("document")
    if not doc:
        continue
    fields = doc.get("fields", {})
    referred = list(fields.get("referredWallet", {}).values() or [None])[0]
    referrer = list(fields.get("referrerWallet", {}).values() or [None])[0]
    if referred and referrer:
        referred = referred.lower().strip()
        referrer = referrer.lower().strip()
        if referred in referral_map and referral_map[referred] != referrer:
            dup += 1
        referral_map[referred] = referrer

print(f"referrals 매핑: {len(referral_map)}건 (중복: {dup}건)")

print()
print("=" * 60)
print("Step 2: users 컬렉션 referrerWallet 업데이트")
print("=" * 60)

# users 컬렉션 전체 가져오기
users_url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents:runQuery?key={API_KEY}"
body2 = {
    "structuredQuery": {
        "from": [{"collectionId": "users"}],
        "select": {"fields": [
            {"fieldPath": "walletAddress"},
            {"fieldPath": "referrerWallet"}
        ]}
    }
}
r2 = requests.post(users_url, json=body2, timeout=30)
user_docs = r2.json()

ok = 0
skip_already = 0
skip_no_ref = 0
err = 0

for item in user_docs:
    doc = item.get("document")
    if not doc:
        continue
    
    fields = doc.get("fields", {})
    wallet_raw = fields.get("walletAddress", {})
    wallet = list(wallet_raw.values())[0] if wallet_raw else None
    if not wallet:
        # doc name에서 ID 추출
        wallet = doc["name"].split("/")[-1]
    wallet = wallet.lower().strip()
    
    # 현재 referrerWallet 값
    cur_ref_raw = fields.get("referrerWallet", {})
    cur_ref = list(cur_ref_raw.values())[0] if cur_ref_raw else None
    if cur_ref:
        cur_ref = str(cur_ref).lower().strip()
    
    # referral_map에서 이 wallet의 추천인 찾기
    new_ref = referral_map.get(wallet)
    
    if not new_ref:
        skip_no_ref += 1
        continue
    
    if cur_ref and cur_ref == new_ref:
        skip_already += 1
        continue
    
    # doc_id는 name의 마지막 부분
    doc_id = doc["name"].split("/")[-1]
    
    result = patch_field("users", doc_id, "referrerWallet", new_ref)
    if "error" in result:
        print(f"  ✗ {wallet[:16]}… → {result['error'].get('message','?')}")
        err += 1
    else:
        ok += 1
        if ok % 50 == 0:
            print(f"  ✓ {ok}건 업데이트 완료...")

print()
print("=" * 60)
print(f"완료: 업데이트 {ok}건 | 이미 설정됨 {skip_already}건 | 추천인 없음 {skip_no_ref}건 | 오류 {err}건")
print("=" * 60)

# 결과 검증
print()
print("=== 검증: referrerWallet 있는 users 샘플 ===")
body3 = {
    "structuredQuery": {
        "from": [{"collectionId": "users"}],
        "where": {
            "fieldFilter": {
                "field": {"fieldPath": "referrerWallet"},
                "op": "NOT_EQUAL",
                "value": {"nullValue": None}
            }
        },
        "limit": 3
    }
}
r3 = requests.post(users_url, json=body3, timeout=10)
for item in r3.json():
    doc = item.get("document")
    if not doc:
        continue
    f = doc.get("fields", {})
    wallet = list(f.get("walletAddress", {}).values() or ["?"])[0]
    ref = list(f.get("referrerWallet", {}).values() or ["null"])[0]
    print(f"  wallet: {str(wallet)[:20]}...  referrer: {str(ref)[:20]}...")
