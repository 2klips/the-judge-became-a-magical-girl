# P0 Required Image Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 게임 계약을 바꾸지 않고 `gray_wraith.weakened`, `transform.cast`, `transform.complete` 실파일을 추가하고 로컬 테스트 URL에서 검증한다.

**Architecture:** `src/assets/catalog.ts`의 기존 논리 ID와 경로를 유지한다. 채택 파일을 `assets/source/p0-required-images/delivery/`에 증빙하고 같은 바이트를 `assets/runtime/`에 배치하며, 기존 `physical → derived/placeholder` 폴백은 보존한다.

**Tech Stack:** Codex built-in `image_gen`, imagegen chroma-key helper, FFmpeg, Vite 8, TypeScript 7, Vitest 4, in-app Browser

---

## 파일 구조

**Create:**

- `assets/source/p0-required-images/delivery/char_gray_wraith_weakened.png`
- `assets/source/p0-required-images/delivery/cut_transform_01.webp`
- `assets/source/p0-required-images/delivery/cut_transform_02.webp`
- `assets/runtime/char/char_gray_wraith_weakened.png`
- `assets/runtime/cut/cut_transform_01.webp`
- `assets/runtime/cut/cut_transform_02.webp`

**Modify:**

- `tests/m5Assets.test.ts`: P0 3종의 source/runtime 동일성, 해상도, 알파, 포맷, 용량 검사.
- `docs/assets/ASSET_MANIFEST.md`: `missing`을 `ready`로 변경하고 실제 QA 기록.
- `docs/assets/SCENE_ASSET_MAPPING.md`: 기존 사용처에 물리 파일 채택 상태 기록.
- `docs/assets/IMAGE_REWORK_REQUEST.md`: 3종 납품 완료·사람 QA 대기 기록.
- `docs/assets/PROVENANCE.md`: 생성 도구·레퍼런스·SHA-256·source/runtime 관계 기록.
- `docs/assets/AI_PRODUCTION_LOG.md`: 프롬프트·후보·채택·토큰 사용 기록.
- `docs/dev/IMPLEMENTATION_LOG.md`: 수행 사실과 검증 결과 기록.
- `docs/dev/LEARNING_LOG.md`: 초보자용 구조 설명.

**Do not modify:** `src/assets/catalog.ts`, `public/scenario/scenario.json`, `src/ui/gameView.ts`, `src/styles.css`, `docs/dev/DECISIONS.md`, `docs/dev/MILESTONES.md`.

---

### Task 1: 물리 파일 계약을 RED 테스트로 고정

**Files:**
- Modify: `tests/m5Assets.test.ts`

- [ ] **Step 1: P0 source·컷 상수 추가**

`runtimeBgm` 뒤에 추가한다.

```ts
const p0ImageSourceDirectory = resolve(
  "assets",
  "source",
  "p0-required-images",
  "delivery",
);

const runtimeP0Cuts = [
  "cut_transform_01.webp",
  "cut_transform_02.webp",
] as const;
```

- [ ] **Step 2: P0 3종 규격 테스트 추가**

`회색 망령 normal은 납품 source와 같은...` 테스트 다음에 추가한다.

```ts
it("P0 필수 이미지 3종은 source와 같은 runtime 규격 파일이다", () => {
  expectTransparentCharacterAsset(
    "char_gray_wraith_weakened.png",
    p0ImageSourceDirectory,
  );

  for (const filename of runtimeP0Cuts) {
    const sourcePath = resolve(p0ImageSourceDirectory, filename);
    const runtimePath = resolve("assets", "runtime", "cut", filename);
    const runtimeFile = readFileSync(runtimePath);

    expect(runtimeFile.equals(readFileSync(sourcePath)), filename).toBe(true);
    expect(readWebpDimensions(runtimeFile), filename).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(statSync(runtimePath).size, filename).toBeLessThanOrEqual(700 * 1024);
  }
});
```

- [ ] **Step 3: 새 테스트가 파일 부재로 실패하는지 확인**

Run: `npm test -- tests/m5Assets.test.ts`

Expected: 신규 테스트만 `ENOENT`로 FAIL. 기존 논리 ID 테스트는 PASS.

- [ ] **Step 4: 예상 변경만 확인**

Run: `git diff --check`

Run: `git status --short`

Expected: `tests/m5Assets.test.ts`만 수정.

---

### Task 2: C 하이브리드 후보 3종 생성·시각 검수

**References:**

- `assets/runtime/char/char_gray_wraith_normal.png`: 약화 망령 편집 대상, 포즈·캔버스 lock.
- `docs/gray-wraith-action-v2/delivery/char/char_gray_wraith_hit.png`: 균열·청백색 빛만 참고.
- `assets/runtime/bg/bg_transform_space.webp`: 변신 공간·팔레트 lock.
- `assets/runtime/char/char_doyun_magical_pose.png`: 도윤 의상·체형·지팡이 lock.
- `assets/runtime/char/char_juno_happy.png`: 주노 외형·색·비율 lock.

**Intermediate:** `output/imagegen/p0-required-images/` (Git 제외)

- [ ] **Step 1: view_image로 레퍼런스 5개 재확인**

망령 normal의 포즈와 투명 여백, 도윤 의상 색, 주노 외형, 변신 공간을 화면으로 확인한다.

- [ ] **Step 2: 약화 망령 built-in edit 실행**

References: normal, hit.

```text
Use case: identity-preserve
Asset type: transparent visual-novel enemy sprite
Primary request: Edit the gray wraith normal sprite into its weakened state.
Input images: Image 1 is the exact edit target and pose/canvas/silhouette lock. Image 2 is reference only for cyan crystalline cracks and inner light; do not copy its pose.
Subject: the same heavy gray fog wraith, split by irregular cracks with soft cyan-white light leaking from trapped game-character energy inside.
Composition: preserve Image 1 exactly — same front-facing pose, position, scale, crop, proportions, and padding.
Mood: heavy and resigned, not screaming or exaggerated pain.
Backdrop: perfectly flat solid #00ff00 chroma-key, uniform edge to edge.
Constraints: no cast shadow, floor, reflection, readable inner face, text, UI, logo, watermark; no #00ff00 in the subject.
Avoid: hit recoil, attack pose, extra limbs, changed silhouette, explosion.
```

Copy the selected output to `output/imagegen/p0-required-images/gray-wraith-weakened-chroma.png`.

- [ ] **Step 3: 변신 영창 built-in generation 실행**

References: transform background, Doyun, Juno.

```text
Use case: compositing
Asset type: 16:9 Korean visual-novel transformation cutscene
Primary request: Create the incantation moment immediately after a magical employee ID card approves transformation.
Input images: Image 1 locks the office transformation space and blue-gold style. Image 2 locks Doyun's outfit colors, proportions, black hair, and star wand. Image 3 locks Juno's yellow chick mascot identity and wand.
Subject: a floating employee ID card is the focal point; Doyun and Juno chant together.
Composition: wide cinematic key art, blank ID center-left foreground, Doyun center midground, Juno clearly readable at one side.
Mood: sincere magical-girl activation, energetic but not explosive.
Constraints: blank unreadable ID; no letters, numbers, dialogue, UI, logo, watermark; preserve character identities.
Avoid: extra characters, different mascot species, parody, photorealism, effects covering faces.
```

Copy the selected output to `output/imagegen/p0-required-images/cut-transform-01-generated.png`.

- [ ] **Step 4: 변신 완료 built-in generation 실행**

Use the same three references.

```text
Use case: compositing
Asset type: 16:9 Korean visual-novel transformation completion cutscene
Primary request: Create the shared transformation-complete key art used by perfect, standard, and rescue outcomes.
Input images: Image 1 locks the magical office and blue-gold palette. Image 2 locks Doyun's white, black, orange, teal outfit, black hair, proportions, and star wand. Image 3 locks Juno's identity.
Subject: Doyun from rear three-quarter or side three-quarter view in a confident resolved pose, with Juno beside her.
Composition: wide cinematic key art, readable silhouette, outer 8 percent crop-safe margin.
Mood: completed transformation, sincere confidence, warm partnership, no outcome grade implication.
Constraints: no text, dialogue, UI, grade badge, logo, watermark; preserve outfit and character identities.
Avoid: front-only pose, alternate costume, extra people, victory or defeat symbols, parody, photorealism.
```

Copy the selected output to `output/imagegen/p0-required-images/cut-transform-02-generated.png`.

- [ ] **Step 5: 후보당 가장 큰 계약 위반 하나만 수정**

`view_image`로 검사한다. 불합격 후보는 built-in edit 한 번으로 가장 큰 문제 하나만 수정한다. 망령 포즈·크기 불변, 영창의 무문자 사원증·도윤·주노, 완료의 반측면/뒷모습·기존 의상, 텍스트·워터마크 없음이 모두 충족돼야 한다.

- [ ] **Step 6: 사용자 시각 체크포인트**

세 후보를 한 화면에 표시한다. 수정 파일, 생성 이유, 계약 검증 결과를 보고하고 아트 수정 요구가 있으면 Step 5 규칙으로 반영한다.

---

### Task 3: 투명화·규격 정규화·runtime 채택

**Files:**
- Create: source 3종과 runtime 3종
- Modify: `tests/m5Assets.test.ts`

- [ ] **Step 1: chroma-key를 알파 PNG로 변환**

```powershell
python C:\Users\user\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py --input output\imagegen\p0-required-images\gray-wraith-weakened-chroma.png --out output\imagegen\p0-required-images\gray-wraith-weakened-alpha.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

Expected: 투명 모서리 PNG. 초록 fringe가 보일 때만 `--edge-contract 1`로 한 번 재실행.

- [ ] **Step 2: 약화 망령 정규화**

```powershell
ffmpeg -y -i output\imagegen\p0-required-images\gray-wraith-weakened-alpha.png -vf "scale=1200:2000:flags=lanczos,format=rgba" -frames:v 1 -compression_level 9 assets\source\p0-required-images\delivery\char_gray_wraith_weakened.png
```

Expected: 1200×2000 RGBA PNG, 800KB 이하.

- [ ] **Step 3: 컷 2장 정규화**

```powershell
ffmpeg -y -i output\imagegen\p0-required-images\cut-transform-01-generated.png -vf "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" -frames:v 1 -c:v libwebp -q:v 78 -compression_level 6 -preset picture assets\source\p0-required-images\delivery\cut_transform_01.webp
ffmpeg -y -i output\imagegen\p0-required-images\cut-transform-02-generated.png -vf "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" -frames:v 1 -c:v libwebp -q:v 78 -compression_level 6 -preset picture assets\source\p0-required-images\delivery\cut_transform_02.webp
```

Expected: 각 1920×1080 WebP, 700KB 이하. 상한 초과 파일만 `-q:v 72`로 한 번 재인코딩.

- [ ] **Step 4: source 채택본을 runtime에 복사**

```powershell
New-Item -ItemType Directory -Force -Path assets\runtime\cut | Out-Null
Copy-Item -LiteralPath assets\source\p0-required-images\delivery\char_gray_wraith_weakened.png -Destination assets\runtime\char\char_gray_wraith_weakened.png
Copy-Item -LiteralPath assets\source\p0-required-images\delivery\cut_transform_01.webp -Destination assets\runtime\cut\cut_transform_01.webp
Copy-Item -LiteralPath assets\source\p0-required-images\delivery\cut_transform_02.webp -Destination assets\runtime\cut\cut_transform_02.webp
```

- [ ] **Step 5: GREEN 확인**

Run: `npm test -- tests/m5Assets.test.ts`

Expected: 전체 PASS. 신규 테스트가 source/runtime 동일성·PNG 알파·해상도·용량·WebP 규격을 검증.

- [ ] **Step 6: 에셋·테스트 커밋**

```powershell
git add tests/m5Assets.test.ts assets/source/p0-required-images/delivery assets/runtime/char/char_gray_wraith_weakened.png assets/runtime/cut
git diff --cached --check
git commit -m "feat(assets): add P0 required images"
```

---

### Task 4: SSOT·증빙·학습 기록 갱신

**Files:**
- Modify: 위 파일 구조의 문서 7개

- [ ] **Step 1: 실제 크기·SHA-256 수집**

```powershell
Get-Item -LiteralPath assets\runtime\char\char_gray_wraith_weakened.png,assets\runtime\cut\cut_transform_01.webp,assets\runtime\cut\cut_transform_02.webp | Select-Object Name,Length
Get-FileHash -Algorithm SHA256 -LiteralPath assets\runtime\char\char_gray_wraith_weakened.png,assets\runtime\cut\cut_transform_01.webp,assets\runtime\cut\cut_transform_02.webp
```

출력값을 추정하지 않고 그대로 기록한다.

- [ ] **Step 2: 에셋 상태 문서 갱신**

- `ASSET_MANIFEST.md`: 3개 행을 `ready`로 변경하고 자동 규격·source/runtime 동일성 PASS, 사람 QA 대기를 기록.
- `SCENE_ASSET_MAPPING.md`: node/phase 사용처는 그대로 두고 2026-08-11 물리 파일 채택과 폴백 유지 사실만 추가.
- `IMAGE_REWORK_REQUEST.md`: 요구 문장과 과거 폴백은 보존하고 `납품·runtime 채택, 사람 QA 대기`를 추가.

- [ ] **Step 3: provenance와 AI 로그 갱신**

- `PROVENANCE.md`: 레퍼런스 5개, built-in image_gen, chroma-key helper, FFmpeg, 실제 SHA-256, source/runtime 동일 바이트, 모델·작업 ID 미노출, 공개 사용 권리 사람 확인 대기 기록.
- `AI_PRODUCTION_LOG.md`: C 선택, 프롬프트 요약, 수정·채택·폐기, 사용자 검수 상태, Codex 토큰 사용률 기록.

- [ ] **Step 4: 수행 사실과 학습 설명 분리**

- `IMPLEMENTATION_LOG.md`: 브랜치·시작 커밋, 변경 파일, 자동·브라우저 검증, 커밋, 남은 위험만 기록.
- `LEARNING_LOG.md`: 논리 ID=주소표, runtime=매장 진열본, source=납품 증빙본, 폴백=비상 대체 경로 비유를 기록. 수치·테스트 결과는 `IMPLEMENTATION_LOG.md`를 참조.
- `DECISIONS.md`, `MILESTONES.md`는 수정하지 않음.

- [ ] **Step 5: 링크·역할·예상 외 변경 검증**

Run: `rg -n "gray_wraith.weakened|transform.cast|transform.complete|char_gray_wraith_weakened|cut_transform_01|cut_transform_02" docs/assets docs/dev`

Run: `git diff --check`

Run: `git status --short`

Expected: 계획된 문서 7개만 수정. SSOT 우선순위와 DEC-016·060 불변.

- [ ] **Step 6: 문서 커밋**

```powershell
git add docs/assets/ASSET_MANIFEST.md docs/assets/SCENE_ASSET_MAPPING.md docs/assets/IMAGE_REWORK_REQUEST.md docs/assets/PROVENANCE.md docs/assets/AI_PRODUCTION_LOG.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md
git diff --cached --check
git commit -m "docs(assets): record P0 image delivery"
```

---

### Task 5: 전체 자동 검증

**Verify:** `dist/assets/char/char_gray_wraith_weakened.png`, `dist/assets/cut/cut_transform_01.webp`, `dist/assets/cut/cut_transform_02.webp`

- [ ] Run `npm run check` — Expected: TypeScript 오류 0.
- [ ] Run `npm test` — Expected: 기존 41 test files와 신규 P0 테스트 PASS.
- [ ] Run `npm run build` — Expected: production build PASS. 기존 Transformers chunk 경고만 허용.
- [ ] Run 아래 명령 — Expected: dist에 세 파일 존재, runtime과 같은 크기.

```powershell
Get-Item -LiteralPath dist\assets\char\char_gray_wraith_weakened.png,dist\assets\cut\cut_transform_01.webp,dist\assets\cut\cut_transform_02.webp | Select-Object Name,Length
```

---

### Task 6: 브라우저 QA와 테스트 URL

- [ ] **Step 1: 고정 포트 서버 시작**

Run: `npm run dev -- --host 127.0.0.1 --port 5173`

Playable:

```text
http://127.0.0.1:5173/the-judge-became-a-magical-girl/
```

Direct QA:

```text
http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=n5-transformation
http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p2
http://127.0.0.1:5173/the-judge-became-a-magical-girl/?debug=1&scene=battle-p3-spell
```

- [ ] **Step 2: 변신 컷 검증**

`n5-transformation`에서 두 컷이 1920×1080, HTTP 200 `image/webp`, 검은 placeholder 아님, 영창→완료 순서인지 확인한다.

- [ ] **Step 3: 약화 망령 검증**

`battle-p2`, `battle-p3-spell`에서 1200×2000, HTTP 200 `image/png`, `asset-derived-wraith-weakened` CSS 폴백 없이 표시되는지 확인한다.

- [ ] **Step 4: 1280×720·390×844 검증**

핵심 피사체 crop, 가로 overflow, 이미지 로드 오류, console error를 확인한다. P0 3종 누락 경고는 없어야 한다.

- [ ] **Step 5: 최종 Git 감사**

```powershell
git diff --stat 9fd85cc..HEAD
git diff --name-status 9fd85cc..HEAD
git status --short
git log --oneline 9fd85cc..HEAD
```

Expected: 테스트·에셋 6개·문서 7개만 계획대로 변경되고 작업 트리 clean. 예상 외 변경이 있으면 완료 보고를 중단한다.

- [ ] **Step 6: 최종 보고**

수정 파일·이유, 3종 규격·SHA-256·시각 QA, check/test/build, 각 커밋·최종 HEAD, 플레이/직접 QA URL, 사람 아트 승인과 공개 배포가 남았음, push·PR·main merge 미수행을 보고한다.

---

## 자체 검토

- 설계의 3종 규격, C 하이브리드, 코드·시나리오 불변, 폴백 유지, 문서 책임, 자동·브라우저 검증, 로컬 URL, 무배포 경계를 Task 1~6에 연결했다.
- 미정 자리표시자, 신규 논리 ID, 임의 코드 변경 단계가 없다.
- 기존 helper `expectTransparentCharacterAsset`, `readWebpDimensions`와 실제 프리뷰 ID `n5-transformation`, `battle-p2`, `battle-p3-spell`을 사용한다.
