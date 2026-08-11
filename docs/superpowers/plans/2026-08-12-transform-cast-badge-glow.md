# `transform.cast` 사원증 인증광 보정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 `transform.cast` 컷의 사원증에 A2 균형형 인증광을 추가해 변신 시작의 인과를 강화하고, 인물·포즈·장면 순서·코드는 그대로 유지한다.

**Architecture:** 현재 채택 WebP를 단일 편집 대상으로 사용하고, 교체 전 SHA-256을 거부하는 자산 회귀 테스트를 먼저 RED로 만든다. 편집 후보를 사람 시각 검수한 뒤 1920×1080 WebP로 정규화해 source/runtime에 동일 바이트로 채택한다. 게임 production 코드와 CSS는 수정하지 않고, 최종 자동·데스크톱 브라우저 QA 증거를 역할별 문서에 분리해 기록한다.

**Tech Stack:** Codex 내장 OpenAI 이미지 편집 도구, FFmpeg, PowerShell `Get-FileHash`, TypeScript, Vitest, Vite, Codex 인앱 Browser

---

## 파일 구조와 책임

### 생성

- `docs/superpowers/plans/2026-08-12-transform-cast-badge-glow.md`: 이 구현 계획

### 수정

- `tests/m5Assets.test.ts`: A2 발광 전 최종 SHA-256도 superseded 자산으로 거부
- `assets/source/p0-required-images/delivery/cut_transform_01.webp`: 제작·추적용 최종 원본
- `assets/runtime/cut/cut_transform_01.webp`: 게임이 실제 로드하는 동일 바이트 복사본
- `docs/assets/ASSET_MANIFEST.md`: 현재 파일 규격·크기·상태
- `docs/assets/SCENE_ASSET_MAPPING.md`: N5 영창 컷의 발광 의미와 장면 계약
- `docs/assets/IMAGE_REWORK_REQUEST.md`: A2 보정 요청의 완료 상태
- `docs/assets/PROVENANCE.md`: 편집 입력·도구·후보·최종 hash·권리 상태
- `docs/assets/AI_PRODUCTION_LOG.md`: 이미지 생성 의도·후보 선택·사람 승인 상태
- `docs/dev/IMPLEMENTATION_LOG.md`: 파일 교체·자동 검증·브라우저 QA의 단일 실행 근거
- `docs/dev/LEARNING_LOG.md`: 초보자 관점의 발광 계층과 시각적 인과 설명

### 수정 금지

- `src/`, `public/scenario/`, catalog, CSS, 게임 상태·장면 순서
- `assets/runtime/cut/cut_transform_02.webp`
- 모바일 레이아웃과 모바일 QA 기록

---

### Task 1: 교체 전 A2 미적용 자산을 거부하는 RED 테스트

**Files:**
- Modify: `tests/m5Assets.test.ts:56`
- Test: `tests/m5Assets.test.ts`

- [ ] **Step 1: 시작 상태와 기준 파일을 확인한다**

Run:

```powershell
git status --short
git rev-parse HEAD
Get-FileHash -LiteralPath 'assets\runtime\cut\cut_transform_01.webp' -Algorithm SHA256
```

Expected:

- status 출력 없음
- 시작 HEAD는 계획 커밋
- 현재 SHA-256은 `A9AB42ACC5394E66244C5E8A9DDD863F9C18E21697A69C42448DD3CFAB0D5152`

- [ ] **Step 2: superseded SHA 목록으로 회귀 guard를 확장한다**

`tests/m5Assets.test.ts`의 단일 상수를 아래 배열로 교체한다.

```ts
const supersededTransformCastSha256s = [
  "507CA55683BC50CCBB83B3196598DB4D2DCA1CF82B58A5AEF796CD007634140D",
  "A9AB42ACC5394E66244C5E8A9DDD863F9C18E21697A69C42448DD3CFAB0D5152",
] as const;
```

같은 테스트의 hash 검증을 아래처럼 교체한다.

```ts
const transformCastSha256 = createHash("sha256")
  .update(runtimeFile)
  .digest("hex")
  .toUpperCase();
expect(
  supersededTransformCastSha256s,
  "transform.cast must use the approved A2 badge glow revision",
).not.toContain(transformCastSha256);
```

- [ ] **Step 3: focused 테스트가 정확한 이유로 실패하는지 확인한다**

Run:

```powershell
npm test -- tests/m5Assets.test.ts
```

Expected: 12개 중 11 PASS, 1 FAIL. 실패 메시지는 `transform.cast must use the approved A2 badge glow revision`이며 현재 A9AB hash가 목록에 포함됐기 때문이어야 한다.

- [ ] **Step 4: RED 상태에서는 커밋하지 않는다**

Run:

```powershell
git status --short
git diff -- tests/m5Assets.test.ts
```

Expected: 수정 파일은 `tests/m5Assets.test.ts` 하나뿐이다.

---

### Task 2: A2 발광 후보 생성·시각 검수·source/runtime 채택

**Files:**
- Modify: `assets/source/p0-required-images/delivery/cut_transform_01.webp`
- Modify: `assets/runtime/cut/cut_transform_01.webp`
- Modify: `tests/m5Assets.test.ts`
- Test: `tests/m5Assets.test.ts`

- [ ] **Step 1: 편집 대상을 원본 해상도로 확인한다**

Codex `view_image`로 아래 파일을 연다.

```text
assets/runtime/cut/cut_transform_01.webp
```

확인 항목: 평상복 도윤, 사원증 한 개와 자연스러운 손 연결, 보이는 발화 입, 눈 감은 주노의 기도 자세, 청색·금색 야간 사무실과 원형 마법진.

- [ ] **Step 2: 내장 이미지 편집 도구로 후보 한 장을 만든다**

입력 이미지는 현재 `assets/runtime/cut/cut_transform_01.webp` 하나만 사용한다. 프롬프트는 아래 내용을 그대로 포함한다.

```text
Use case: precise-object-edit
Asset type: 16:9 Korean visual-novel transformation cutscene
Input image: the current cut_transform_01.webp is the edit target
Primary request: change only the employee ID badge lighting. Add an A2 balanced magical authentication glow that originates inside the blank white card face.
Lighting: controlled blue-white inner light, a soft borderless cyan halo immediately outside the badge, and only 3–5 tiny warm-gold particles. Let a faint blue-white reflection reach the fingertips holding the badge, but do not light the face.
Preserve: the existing blue plastic badge holder rim, metal clip, blue lanyard, exact badge shape, one badge only, natural hand and finger anatomy, office-clothed Doyun, his identity/face/hair/pose/moderately open speaking mouth, closed-eye Juno praying with both wings around the upright star wand, night office, blue-and-gold magic circle, ribbons, particles, full composition and camera.
Avoid: any new hard white rectangular outline outside the badge, extra frame, second badge, readable text, photo, company mark, logo, UI, watermark, overexposed white block, lens flare, strong rays, full-screen flash, costume change, pose change, face change, extra fingers, extra characters, background replacement.
The final image must remain a polished desktop 16:9 cutscene. Mobile composition is out of scope.
```

도구가 반환한 첫 결과물을 `output/imagegen/transform-cast-badge-glow/cut_transform_01-a2-candidate.png`로 보존한다. 프로젝트 채택 전에는 source/runtime을 덮어쓰지 않는다.

- [ ] **Step 3: 후보를 시각 검수한다**

`view_image` 원본 크기로 다음을 확인한다.

- 카드 흰 면 안쪽이 발광 중심이다.
- 기존 파란 플라스틱 테두리·클립·끈이 남아 있다.
- 테두리 밖에 단단한 흰색 사각선이 없다.
- 부드러운 후광만 카드 주변과 손가락에 제한된다.
- 금색 입자는 3~5개이며 카드와 손을 가리지 않는다.
- 도윤·주노·손·입·포즈·배경·사원증 개수가 바뀌지 않았다.

통과하면 후보를 `output/imagegen/transform-cast-badge-glow/cut_transform_01-a2-selected.png`로 복사한다. 실패 시 전체 재구성 대신 아래 한 번의 표적 편집만 허용한다.

```text
Change only the badge glow. Remove the hard outer rectangular light border and reduce overexposure. Restore the original blue holder rim, clip, lanyard, fingertips, and blank card boundary exactly. Keep every character, pose, face, hand, object count, background, camera, and composition unchanged. Use a softer borderless cyan halo with 3–5 tiny gold particles.
```

표적 편집 결과는 `output/imagegen/transform-cast-badge-glow/cut_transform_01-a2-candidate-b.png`로 보존한다. 검수를 통과한 후보만 `output/imagegen/transform-cast-badge-glow/cut_transform_01-a2-selected.png`로 복사한다.

- [ ] **Step 4: 선택 후보를 1920×1080 WebP로 정규화한다**

```powershell
$badgeCandidate = 'output\imagegen\transform-cast-badge-glow\cut_transform_01-a2-selected.png'
$badgeNormalized = 'output\imagegen\transform-cast-badge-glow\cut_transform_01-a2-normalized.webp'
ffmpeg -y -i $badgeCandidate -vf "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" -c:v libwebp -q:v 84 -compression_level 6 $badgeNormalized
```

Expected: 1920×1080 WebP, 700KB 이하. 중앙 crop이 손·사원증·도윤 입·주노를 자르면 후보를 채택하지 않는다.

- [ ] **Step 5: 정규화본을 source/runtime에 동일 바이트로 채택한다**

```powershell
Copy-Item -LiteralPath $badgeNormalized -Destination 'assets\source\p0-required-images\delivery\cut_transform_01.webp' -Force
Copy-Item -LiteralPath 'assets\source\p0-required-images\delivery\cut_transform_01.webp' -Destination 'assets\runtime\cut\cut_transform_01.webp' -Force
```

- [ ] **Step 6: 파일 계약과 GREEN을 검증한다**

```powershell
$badgeSource = 'assets\source\p0-required-images\delivery\cut_transform_01.webp'
$badgeRuntime = 'assets\runtime\cut\cut_transform_01.webp'
Get-Item -LiteralPath $badgeSource,$badgeRuntime | Select-Object FullName,Length
Get-FileHash -LiteralPath $badgeSource,$badgeRuntime -Algorithm SHA256
npm test -- tests/m5Assets.test.ts
```

Expected:

- 두 파일 각각 700KB 이하
- 두 SHA-256 동일, A9AB 및 507C와 다름
- focused 12/12 PASS

- [ ] **Step 7: 정확히 세 파일을 커밋한다**

```powershell
git status --short
git diff --check
git add -- tests/m5Assets.test.ts assets/source/p0-required-images/delivery/cut_transform_01.webp assets/runtime/cut/cut_transform_01.webp
git commit -m "feat(assets): add transform cast badge glow"
```

Expected: 테스트 1개와 source/runtime WebP 두 개만 커밋된다.

---

### Task 3: 자산 사실·장면 계약·초보자 설명 갱신

**Files:**
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/assets/IMAGE_REWORK_REQUEST.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`

- [ ] **Step 1: 최종 자산 사실을 수집한다**

```powershell
$badgeSource = 'assets\source\p0-required-images\delivery\cut_transform_01.webp'
$badgeRuntime = 'assets\runtime\cut\cut_transform_01.webp'
Get-Item -LiteralPath $badgeSource,$badgeRuntime | Select-Object FullName,Length
Get-FileHash -LiteralPath $badgeSource,$badgeRuntime -Algorithm SHA256
git rev-parse HEAD
```

기록할 값: 최종 바이트, SHA-256, 자산 커밋, 1920×1080 WebP, source/runtime 동일 여부.

- [ ] **Step 2: 역할별 문서를 수정한다**

다음 내용을 각 문서 책임에 맞게 한 번만 기록한다.

- `ASSET_MANIFEST.md`: `transform.cast` 행의 새 바이트/hash와 A2 내부 발광 상태
- `SCENE_ASSET_MAPPING.md`: N5 `cast`가 사원증 내부 인증광으로 시작됨. 기존 테두리·클립 유지, 단단한 추가 사각 테두리 없음
- `IMAGE_REWORK_REQUEST.md`: 2026-08-12 A2 발광 보정 완료와 모바일 제외
- `PROVENANCE.md`: 기준 A9AB 파일, 내장 편집 도구, 후보·표적 보정 여부, 최종 hash, 권리 미확인
- `AI_PRODUCTION_LOG.md`: 사용자 A2 선택, 편집 의도, 후보 판단, 토큰 `미측정`, `ready`/not `approved`. 실행 테스트 수치는 쓰지 않고 `IMPLEMENTATION_LOG.md` 해당 절로 링크
- `IMPLEMENTATION_LOG.md`: 변경 파일·RED/GREEN·정규화·hash와 데스크톱 QA는 아직 `pending`으로 기록
- `LEARNING_LOG.md`: 초보자용으로 “물체 안쪽 발광·테두리·후광”의 차이와 과노출이 정보 손실을 만드는 이유만 설명. 실행 hash·테스트 표를 복제하지 않음

- [ ] **Step 3: 현재 사실과 역사 기록을 구분한다**

```powershell
rg -n "A9AB42|200,470|발광 없음|단단한.*사각|모바일.*PASS|approved" docs\assets docs\dev
```

Expected: A9AB/200,470B는 이전 채택본 또는 superseded라고 명시된다. 현재 수정에 모바일 PASS나 `approved` 주장이 없다.

- [ ] **Step 4: 문서 링크와 diff를 검증한다**

상대 Markdown 링크는 문서 파일 위치 기준으로 실제 대상과 heading anchor가 존재하는지 확인한다.

```powershell
git diff --check
git status --short
```

Expected: 위 7개 문서만 수정되고 코드·시나리오·에셋 추가 변경은 없다.

- [ ] **Step 5: 문서 커밋을 만든다**

```powershell
git add -- docs/assets/ASSET_MANIFEST.md docs/assets/SCENE_ASSET_MAPPING.md docs/assets/IMAGE_REWORK_REQUEST.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git commit -m "docs(assets): record transform cast badge glow"
```

---

### Task 4: 전체 자동 검증·데스크톱 Browser QA·최종 증거 기록

**Files:**
- Verify: `dist/assets/cut/cut_transform_01.webp`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`

- [ ] **Step 1: 전체 자동 검증을 새로 실행한다**

```powershell
npm run check
npm test
npm run build
```

Expected:

- TypeScript 오류 0
- 전체 테스트 PASS
- Vite build PASS
- 기존 대형 Transformers 청크 경고는 비차단 관찰로 정확한 크기와 함께 기록

- [ ] **Step 2: 빌드 산출물 무결성을 확인한다**

```powershell
$badgeSource = 'assets\source\p0-required-images\delivery\cut_transform_01.webp'
$badgeRuntime = 'assets\runtime\cut\cut_transform_01.webp'
$badgeDist = 'dist\assets\cut\cut_transform_01.webp'
Get-Item -LiteralPath $badgeSource,$badgeRuntime,$badgeDist | Select-Object FullName,Length
Get-FileHash -LiteralPath $badgeSource,$badgeRuntime,$badgeDist -Algorithm SHA256
@(Get-ChildItem -LiteralPath 'dist' -Recurse -File | Where-Object { $_.Name -eq 'cut_transform_01.webp' }).Count
```

Expected: 세 파일의 바이트와 SHA-256이 같고 `dist` 일치 파일은 정확히 1개다.

- [ ] **Step 3: 데스크톱 게임 서버를 실행한다**

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

검증 URL:

```text
http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-incantation
http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-transformation
```

- [ ] **Step 4: Browser 1280×720에서 영창 순서를 확인한다**

`browser:control-in-app-browser` 지침을 읽고 다음을 검증한다.

- `n5-incantation`: 도윤 `normal_shy` 평상복 선행
- `n5-transformation` `cast`: 새 WebP가 natural 1920×1080으로 표시되고 black/fallback 없음
- 카드 흰 면 안쪽 청백광, 기존 파란 테두리·클립·끈·손가락 식별
- 경계 없는 부드러운 후광과 작은 금색 입자
- 단단한 새 바깥 사각 테두리·추가 사원증·과노출 없음
- 도윤의 발화 입과 주노의 기도 자세 유지
- `cast → complete`: 후속 마법 복장 완료 컷 유지
- `document.documentElement.scrollWidth - document.documentElement.clientWidth === 0`
- console error 0

모바일 viewport는 설정하거나 PASS로 기록하지 않는다. 완료 뒤 1280×720로 둔다.

- [ ] **Step 5: 실행 증거의 단일 근거를 확정한다**

- `IMPLEMENTATION_LOG.md`: 실제 check/test/build 수치, build 경고, source/runtime/dist hash·바이트·복사본 수, Browser 결과를 기록
- `AI_PRODUCTION_LOG.md`: 사람 제작·선택·권리 상태만 유지하고 실행 증거는 `IMPLEMENTATION_LOG.md` heading 링크로 참조
- 자동 계약은 `ready`; 사람 미술·참조 권리·생성 서비스 플랜·공개 배포 확인은 pending; `approved` 아님

- [ ] **Step 6: 최종 QA 문서 커밋을 만든다**

```powershell
git diff --check
git status --short
git add -- docs/assets/AI_PRODUCTION_LOG.md docs/dev/IMPLEMENTATION_LOG.md
git commit -m "docs(qa): verify transform cast badge glow"
```

Expected: 두 QA 문서만 커밋된다.

---

### Task 5: 최종 범위·커밋·clean 상태 검토

**Files:**
- Verify: 전체 작업 범위

- [ ] **Step 1: 예상 파일만 변경됐는지 확인한다**

```powershell
git diff --stat 1ecae552c650077533ea41cac17a942346541d2e..HEAD
git diff --check 1ecae552c650077533ea41cac17a942346541d2e..HEAD
git status --short
```

Expected:

- 자산 source/runtime 2개
- 자산 테스트 1개
- 지정 문서 7개
- production 코드·CSS·scenario 변경 없음
- final status clean

- [ ] **Step 2: 최종 커밋과 HEAD를 보고한다**

```powershell
git log --oneline 1ecae552c650077533ea41cac17a942346541d2e..HEAD
git rev-parse HEAD
```

보고 내용: 각 커밋 SHA, 최종 HEAD, 브랜치명, 테스트 URL, 모바일 제외, 남은 사람 미술·권리·공개 배포 게이트.

- [ ] **Step 3: 원격 작업을 하지 않는다**

push, PR, main merge는 별도 사용자 지시 전까지 실행하지 않는다.
