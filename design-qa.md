# Phase C PC TITLE Design QA

- 검수일: 2026-08-15 KST
- source: `C:/Users/user/AppData/Local/Temp/codex-clipboard-64d2b13c-cac9-47bf-9a16-ea05ad8c2b72.png`
- prototype: `http://127.0.0.1:5174/the-judge-became-a-magical-girl/`
- browser: Google Chrome 151 계열 user profile

## 비교 이력

1. 승인 시안과 구현을 같은 Chrome QA 출력에서 1680×946 hover 상태로 나란히 비교했다.
2. 최초 비교에서 구현 h1의 1366px 기준 최소 크기가 46px로 제품 계약 52~64px보다 작았다.
3. `.title-heading`을 `clamp(3.25rem, 3.35vw, 4rem)`으로 수정하고 semantic CSS test를 추가했다.
4. 수정 후 실제 MaruBuri가 로드된 1366×768에서 h1 52px, `scrollWidth=1366`, `scrollHeight=768`을 재확인했다.

## 최종 시각 판정

- 1920×1080: `scrollWidth=1920`, `scrollHeight=1080`; TITLE·메뉴·mic·BGM 겹침 없음.
- 1600×900: `scrollWidth=1600`, `scrollHeight=900`; 기존 931px overflow 해소.
- 1366×768: `scrollWidth=1366`, `scrollHeight=768`; h1·focus outline·compact mic가 viewport 안에 유지.
- 국소 left gradient가 TITLE 가독성을 확보하고 오른쪽 NHN 건물·HACKATHON banner를 보존한다.
- Game Start 기본은 투명, hover/focus만 soft pink panel이다. hover exit 뒤 glow·설명 잔존 없음.
- save 없는 Continue는 `aria-disabled=true`지만 Tab 접근과 `아직 저장된 이야기가 없습니다.` 설명을 유지한다.
- MaruBuri 600·Pretendard 400/600은 local asset으로 로드되며 외부 font URL은 0이다.
- font HTTP는 OTF `font/otf`, WOFF2 `font/woff2`로 200; Chrome console font decode warning/error 0.
- P0/P1/P2 시각 결함: 없음.

final result: passed
