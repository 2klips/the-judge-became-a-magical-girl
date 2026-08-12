# 늦은 밤 공동 야근 시나리오·에셋 연속성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** N0부터 전투까지를 핵심 심사팀이 함께 야근하는 같은 늦은 밤으로 통일하고, GOOD 엔딩의 아침을 밤샘 뒤 시간 경과로 명확히 연결한다.

**Architecture:** 시나리오 SSOT와 runtime JSON을 먼저 회귀 테스트로 고정한다. 배경 5개와 변신 컷 2개는 기존 이미지를 edit target으로 사용해 프로젝트 밖 후보 폴더에 생성하고, 사람 시각 승인 뒤에만 source/runtime에 동일 바이트로 채택한다. 논리 ID·분기·게임 엔진은 유지하고 문서 역할에 맞게 제작·결정·검증 증거를 나눈다.

**Tech Stack:** Markdown, JSON, TypeScript, Vitest, Codex built-in `image_gen`, FFmpeg, PowerShell `Get-FileHash`, Vite, 데스크톱 브라우저 QA

---

## 파일 구조와 책임

### 생성

- `tests/scenarioContinuity.test.ts`: 공동 야근·시간 정지·GOOD 아침 연결 회귀 계약
- `assets/source/background/delivery/bg_office_wide.webp`: N0 늦은 밤 공동 야근 보존본
- `assets/source/background/delivery/bg_hall_dark.webp`: 회색 침식 늦은 밤 보존본
- `assets/source/background/delivery/bg_transform_space.webp`: 변신 공간 늦은 밤 보존본
- `assets/source/background/delivery/bg_battle_wide.webp`: 전투 와이드 늦은 밤 보존본
- `assets/source/background/delivery/bg_battle_core.webp`: 최종전 늦은 밤 보존본
- `docs/superpowers/plans/2026-08-13-late-night-team-overtime-continuity.md`: 이 계획

### 수정

- `docs/심사역은_마법소녀가_되었다_완성대본_v2.md`: 이야기 SSOT의 공동 야근·시간 정지·아침 전환
- `public/scenario/scenario.json`: 실제 게임 문구
- `tests/m5Assets.test.ts`: 신규 background source/runtime 동일 바이트·규격 계약과 변신 컷 superseded hash
- `assets/source/p0-required-images/delivery/cut_transform_01.webp`: A2 사원증 발광 야간 컷 보존본
- `assets/source/p0-required-images/delivery/cut_transform_02.webp`: 늦은 밤 변신 완료 컷 보존본
- `assets/runtime/bg/bg_office_wide.webp`
- `assets/runtime/bg/bg_hall_dark.webp`
- `assets/runtime/bg/bg_transform_space.webp`
- `assets/runtime/bg/bg_battle_wide.webp`
- `assets/runtime/bg/bg_battle_core.webp`
- `assets/runtime/cut/cut_transform_01.webp`
- `assets/runtime/cut/cut_transform_02.webp`
- `docs/assets/ASSET_MANIFEST.md`: 파일 규격·크기·hash·상태
- `docs/assets/SCENE_ASSET_MAPPING.md`: 장면별 늦은 밤·동료 배치 계약
- `docs/assets/AI_PRODUCTION_LOG.md`: 편집 입력·프롬프트·후보·사람 승인 상태
- `docs/assets/PROVENANCE.md`: 생성 도구·원본·권리 상태
- `docs/dev/DECISIONS.md`: 공동 야근과 시간 정지 선택 이유
- `docs/dev/IMPLEMENTATION_LOG.md`: 실제 수정과 자동·브라우저 검증
- `docs/dev/LEARNING_LOG.md`: 초보자용 시나리오와 화면 연속성 설명
- `docs/dev/MILESTONES.md`: 단계 완료 상태

### 수정 금지

- `src/` production 코드, catalog 논리 ID, CSS, 분기 조건, 엔딩 판정
- `assets/source/background/심사역은_마법소녀가_되었다_최종확정_배경세트.zip`
- 모바일 레이아웃·모바일 QA
- 원격 push, main merge, branch 변경, reset, revert, amend

---

### Task 1: 시나리오 연속성 RED 테스트

**Files:**
- Create: `tests/scenarioContinuity.test.ts`
- Test: `tests/scenarioContinuity.test.ts`

- [ ] **Step 1: 시작 상태를 확인한다**

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
```

Expected: status 출력 없음, branch `codex/p0-required-image-assets`, HEAD는 계획 커밋.

- [ ] **Step 2: 현재 문구를 거부하는 테스트를 작성한다**

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type ScenarioNode = {
  nodeId: string;
  lines?: Array<{ speaker: string; text: string }>;
  intents?: Array<{ offlineReply: string }>;
};

const scenario = JSON.parse(
  readFileSync(resolve("public", "scenario", "scenario.json"), "utf8"),
) as ScenarioNode[];
const script = readFileSync(
  resolve("docs", "심사역은_마법소녀가_되었다_완성대본_v2.md"),
  "utf8",
);

function node(nodeId: string): ScenarioNode {
  const found = scenario.find((item) => item.nodeId === nodeId);
  expect(found, `${nodeId} must exist`).toBeDefined();
  return found!;
}

describe("late-night team overtime continuity", () => {
  it("keeps the judging team present instead of leaving Doyun alone", () => {
    const n0Text = node("n0_review").lines?.map(({ text }) => text).join(" ") ?? "";
    expect(n0Text).toContain("도윤과 동료들");
    expect(n0Text).not.toContain("마지막까지 남은 도윤");
    expect(script).toContain("핵심 심사팀은 각자의 자리에서 계속 출품작을 확인한다.");
    expect(script).not.toContain("마지막에는 도윤의 자리 주변만 불이 켜져 있다.");
  });

  it("uses stopped perception rather than an empty office for the transformation", () => {
    const n4Replies = node("n4_team").intents?.map(({ offlineReply }) => offlineReply) ?? [];
    expect(n4Replies).toContain("좋아, 다들 시간이 멈춰서 듣지 못해. 마음껏 외쳐!");
    expect(n4Replies.join(" ")).not.toContain("주변에는 아무도 없어");
    expect(script).toContain("다들 시간이 멈춰서 듣지 못해! 마음껏 망가져도 돼!");
  });

  it("bridges the same late night into the GOOD ending morning", () => {
    const goodText = node("ending_good").lines?.map(({ text }) => text).join(" ") ?? "";
    expect(goodText).toContain("멈췄던 시간이 다시 흐른다");
    expect(goodText).toContain("긴 밤 끝에 아침빛이 사무실로 들어온다");
    expect(script).toContain("멈췄던 시간이 다시 흐른다.");
    expect(script).toContain("긴 밤 끝에 아침빛이 사무실 안으로 들어온다.");
  });
});
```

- [ ] **Step 3: RED를 확인한다**

```powershell
npm test -- tests/scenarioContinuity.test.ts
```

Expected: 3 tests FAIL. 원인은 현재 `마지막까지 남은 도윤`, `주변에는 아무도 없어`, GOOD 연결 문구 부재여야 한다.

---

### Task 2: 대본·runtime 시나리오를 공동 야근으로 맞춘다

**Files:**
- Modify: `docs/심사역은_마법소녀가_되었다_완성대본_v2.md`
- Modify: `public/scenario/scenario.json`
- Test: `tests/scenarioContinuity.test.ts`

- [ ] **Step 1: N0 대본을 교체한다**

기존 두 문장:

```text
시간이 흐르며 한 명씩 자리를 비운다.
마지막에는 도윤의 자리 주변만 불이 켜져 있다.
```

교체 문장:

```text
시간이 흐르며 일부 빈자리가 생기지만,
핵심 심사팀은 각자의 자리에서 계속 출품작을 확인한다.
```

- [ ] **Step 2: 변신 직전과 GOOD 전환 대본을 교체한다**

```text
다들 시간이 멈춰서 듣지 못해! 마음껏 망가져도 돼!
```

GOOD 장면 첫 문장 앞에 다음을 추가한다.

```text
멈췄던 시간이 다시 흐른다.
긴 밤 끝에 아침빛이 사무실 안으로 들어온다.
```

기존 `아침빛이 사무실 안으로 들어온다.`는 중복이므로 삭제한다.

- [ ] **Step 3: runtime JSON의 세 문구를 맞춘다**

```json
{ "speaker": "narration", "text": "늦은 밤, 도윤과 동료들의 모니터에 평가표가 이어진다." }
```

```json
"offlineReply": "좋아, 다들 시간이 멈춰서 듣지 못해. 마음껏 외쳐!"
```

`ending_good.lines`의 제목 다음에 추가:

```json
{ "speaker": "narration", "text": "멈췄던 시간이 다시 흐른다. 긴 밤 끝에 아침빛이 사무실로 들어온다." }
```

- [ ] **Step 4: GREEN과 전체 시나리오 로딩을 확인한다**

```powershell
npm test -- tests/scenarioContinuity.test.ts tests/loader.test.ts tests/engine.test.ts
```

Expected: focused tests PASS, JSON schema·엔진 로딩 PASS.

- [ ] **Step 5: 시나리오 커밋을 만든다**

```powershell
git diff --check
git add -- tests/scenarioContinuity.test.ts public/scenario/scenario.json 'docs/심사역은_마법소녀가_되었다_완성대본_v2.md'
git commit -m "fix(story): align overtime continuity"
```

---

### Task 3: 새 에셋 채택 계약을 RED로 만든다

**Files:**
- Modify: `tests/m5Assets.test.ts`
- Test: `tests/m5Assets.test.ts`

- [ ] **Step 1: background source/runtime 계약 목록을 추가한다**

```ts
const lateNightBackgrounds = [
  "bg_office_wide.webp",
  "bg_hall_dark.webp",
  "bg_transform_space.webp",
  "bg_battle_wide.webp",
  "bg_battle_core.webp",
] as const;

const backgroundSourceDirectory = resolve(
  "assets",
  "source",
  "background",
  "delivery",
);
```

테스트 본문:

```ts
it("late-night backgrounds keep source/runtime identical and valid", () => {
  for (const filename of lateNightBackgrounds) {
    const source = readFileSync(resolve(backgroundSourceDirectory, filename));
    const runtime = readFileSync(resolve("assets", "runtime", "bg", filename));
    expect(runtime.equals(source), filename).toBe(true);
    expect(readWebpDimensions(runtime), filename).toEqual({ width: 1920, height: 1080 });
    expect(runtime.byteLength, filename).toBeLessThanOrEqual(500 * 1024);
  }
});
```

- [ ] **Step 2: 현재 두 transform cut hash를 superseded 목록에 추가한다**

실행 전에 현재 SHA를 수집한다.

```powershell
Get-FileHash -LiteralPath 'assets\runtime\cut\cut_transform_01.webp','assets\runtime\cut\cut_transform_02.webp' -Algorithm SHA256
```

현재 `cut_transform_01` SHA `DC59AF0B57FBBA6B0997BBBD284538B360BBA10713178C70318852FF2DB06ACF`와 `cut_transform_02` SHA `1BBB807758BB978B6C97223E949EF91BF77CB456C30A68AE7E99E29611C32EB6`를 각각 거부 목록에 넣는다. 테스트 메시지는 에셋별로 `must use the approved late-night continuity revision`을 사용한다.

- [ ] **Step 3: RED를 확인한다**

```powershell
npm test -- tests/m5Assets.test.ts
```

Expected: background source delivery 파일 5개 부재 또는 superseded transform hash 때문에 FAIL.

---

### Task 4: 프로젝트 밖에 늦은 밤 후보 7개를 생성한다

**Files:**
- Read only: 기존 runtime 에셋 7개
- Create outside repository: `C:/Users/user/.codex/visualizations/2026/08/12/019ff64a-8a00-72e3-a26f-020f8215bbe6/late-night-team-overtime-candidates/`

- [ ] **Step 1: 모든 edit target을 `view_image` 원본 크기로 확인한다**

```text
assets/runtime/bg/bg_office_wide.webp
assets/runtime/bg/bg_hall_dark.webp
assets/runtime/bg/bg_transform_space.webp
assets/runtime/bg/bg_battle_wide.webp
assets/runtime/bg/bg_battle_core.webp
assets/runtime/cut/cut_transform_01.webp
assets/runtime/cut/cut_transform_02.webp
```

- [ ] **Step 2: 공통 편집 불변식을 모든 프롬프트에 넣는다**

```text
Use case: lighting-weather with precise-object-edit constraints
Asset type: 1920x1080 desktop visual-novel game scene
Primary request: make this the same late-night overtime period, with deep navy night visible outside, cool monitor light, and restrained warm artificial office light.
Preserve exactly: camera, perspective, room geometry, furniture, focal subjects, object count, character identity, pose, anatomy, clothing, props, magic effects, and composition.
Coworkers: only when requested for this asset, use distant anonymous seated silhouettes or blurred backs at workstations; no readable faces and no new named character.
Avoid: sun, sunrise, dawn, sunset, orange sky, bright daytime windows, readable text, UI, personal data, logos, watermark, new foreground character, camera drift, redesigned furniture.
```

- [ ] **Step 3: 배경 5개를 개별 편집한다**

공통 불변식 뒤에 에셋별 요청을 붙인다.

- `bg_office_wide`: `Keep the wide establishing composition. Add 3–5 distant anonymous coworkers still judging submissions at separate desks, with active monitors and restrained task lights.`
- `bg_hall_dark`: `Keep the gray corruption and desk framing. Change the bright window to late night. Add only faint frozen coworker silhouettes in the far background.`
- `bg_transform_space`: `Keep the transformation-space magic, depth, and empty focal area. Change only the sunset/daylight environment to late night; retain very faint frozen coworkers far behind the magic.`
- `bg_battle_wide`: `Keep the wide battle staging and central gameplay readability. Change daylight to late night. Add distant frozen coworkers at desks inside a subtle transparent protective barrier.`
- `bg_battle_core`: `Keep the gray core and battle focus. Replace sunset light with late-night office lighting. Coworkers remain indistinct behind corruption or the protective barrier.`

각 결과를 후보 폴더에 아래 이름으로 복사한다. runtime/source는 덮어쓰지 않는다.

```text
bg_office_wide-candidate.png
bg_hall_dark-candidate.png
bg_transform_space-candidate.png
bg_battle_wide-candidate.png
bg_battle_core-candidate.png
```

- [ ] **Step 4: `cut_transform_01`을 직전 채택 야간 베이스에서 다시 편집한다**

현재 fbe5808을 다시 편집하지 않는다. Git blob `fbe5808^:assets/runtime/cut/cut_transform_01.webp`가 SHA `A9AB42ACC5394E66244C5E8A9DDD863F9C18E21697A69C42448DD3CFAB0D5152`인지 확인해 후보 폴더에 복원한 뒤 edit target으로 본다.

```text
Primary request: change only the employee ID badge lighting. Add soft platinum-white starlight originating inside the blank card and gently reflecting on the surrounding fingertips.
Preserve exactly: original blue plastic holder rim, clip, lanyard, one badge, Doyun identity/face/hair/office clothes/speaking mouth/pose/hand anatomy, Juno praying with closed eyes around the upright star wand, night office, magic circle, ribbons, camera, and composition.
Avoid: hard white or cyan rectangular border outside the holder, second frame, second badge, overexposure, light reaching the face, character or background drift, readable text, UI, logo, watermark.
```

결과를 `cut_transform_01-candidate.png`로 보존한다.

- [ ] **Step 5: `cut_transform_02`는 인물 고정 시간대 편집만 한다**

```text
Primary request: change only the environment time and lighting from sunset/early evening to deep late night.
Preserve exactly: Doyun identity, face, black-white-teal-orange magical costume, crown, ribbons, star wand, pose and anatomy; Juno identity, expression, necklace, wand and pose; all star trails, camera, scale, and composition.
Scene: deep navy night outside; cool blue monitor and magic light; restrained warm office practical lights. Optional coworkers only as tiny frozen silhouettes far in the background.
Avoid: dawn, sunrise, sunset, costume redesign, different character, pose drift, extra limbs, extra foreground people, text, UI, logo, watermark.
```

결과를 `cut_transform_02-candidate.png`로 보존한다.

- [ ] **Step 6: 후보를 원본과 나란히 검수한다**

1920×1080 contact sheet를 만들어 원본/후보를 에셋별 두 열로 배치한다. 검사 항목:

- 모든 창밖이 늦은 밤
- N0에 3~5명, 전투에는 보호받는 먼 동료가 존재
- 주연·구도·가구 드리프트 없음
- `cut_transform_01`에 단단한 추가 사각 테두리 없음
- `cut_transform_02` 의상·지팡이·주노 일치
- baked text/UI/logo 없음

- [ ] **Step 7: 사용자 시각 승인 게이트에서 멈춘다**

contact sheet와 에셋별 권장/거부 이유를 보고한다. 승인 전 프로젝트 에셋을 교체하지 않는다.

---

### Task 5: 승인 후보를 정규화해 source/runtime에 채택한다

**Files:**
- Create/Modify: source/runtime 에셋 14개
- Modify: `tests/m5Assets.test.ts`

- [ ] **Step 1: 승인된 후보만 1920×1080 WebP로 정규화한다**

후보 폴더와 정규화 출력 폴더를 고정하고 배경을 변환한다.

```powershell
$candidateRoot = 'C:\Users\user\.codex\visualizations\2026\08\12\019ff64a-8a00-72e3-a26f-020f8215bbe6\late-night-team-overtime-candidates'
$normalizedRoot = Join-Path $candidateRoot 'normalized'
New-Item -ItemType Directory -Path $normalizedRoot -Force | Out-Null
$backgroundNames = @('bg_office_wide','bg_hall_dark','bg_transform_space','bg_battle_wide','bg_battle_core')
foreach ($name in $backgroundNames) {
  ffmpeg -y -i (Join-Path $candidateRoot "$name-candidate.png") -vf "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" -c:v libwebp -q:v 82 -compression_level 6 (Join-Path $normalizedRoot "$name.webp")
}
ffmpeg -y -i (Join-Path $candidateRoot 'cut_transform_01-candidate.png') -vf "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" -c:v libwebp -q:v 84 -compression_level 6 (Join-Path $normalizedRoot 'cut_transform_01.webp')
ffmpeg -y -i (Join-Path $candidateRoot 'cut_transform_02-candidate.png') -vf "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080" -c:v libwebp -q:v 84 -compression_level 6 (Join-Path $normalizedRoot 'cut_transform_02.webp')
```

중앙 crop이 인물·손·동료·UI 여백을 자르면 채택하지 않는다.

- [ ] **Step 2: 배경 보존본과 runtime을 동일 바이트로 복사한다**

```powershell
New-Item -ItemType Directory -Path 'assets\source\background\delivery' -Force | Out-Null
foreach ($name in $backgroundNames) {
  $filename = "$name.webp"
  Copy-Item -LiteralPath (Join-Path $normalizedRoot $filename) -Destination (Join-Path 'assets\source\background\delivery' $filename) -Force
  Copy-Item -LiteralPath (Join-Path 'assets\source\background\delivery' $filename) -Destination (Join-Path 'assets\runtime\bg' $filename) -Force
}
```

- [ ] **Step 3: 변신 컷 source/runtime을 동일 바이트로 복사한다**

```powershell
$cutNames = @('cut_transform_01','cut_transform_02')
foreach ($name in $cutNames) {
  $filename = "$name.webp"
  Copy-Item -LiteralPath (Join-Path $normalizedRoot $filename) -Destination (Join-Path 'assets\source\p0-required-images\delivery' $filename) -Force
  Copy-Item -LiteralPath (Join-Path 'assets\source\p0-required-images\delivery' $filename) -Destination (Join-Path 'assets\runtime\cut' $filename) -Force
}
```

- [ ] **Step 4: 규격과 GREEN을 확인한다**

```powershell
npm test -- tests/m5Assets.test.ts tests/scenarioContinuity.test.ts
```

Expected: source/runtime 동일 바이트, 배경 500KB 이하, 컷 700KB 이하, 모두 1920×1080, superseded hash 아님, focused tests PASS.

- [ ] **Step 5: 에셋 커밋을 만든다**

```powershell
git diff --check
git add -- tests/m5Assets.test.ts assets/source/background/delivery assets/source/p0-required-images/delivery/cut_transform_01.webp assets/source/p0-required-images/delivery/cut_transform_02.webp assets/runtime/bg/bg_office_wide.webp assets/runtime/bg/bg_hall_dark.webp assets/runtime/bg/bg_transform_space.webp assets/runtime/bg/bg_battle_wide.webp assets/runtime/bg/bg_battle_core.webp assets/runtime/cut/cut_transform_01.webp assets/runtime/cut/cut_transform_02.webp
git commit -m "feat(assets): align late-night overtime scenes"
```

---

### Task 6: 역할별 문서를 갱신한다

**Files:**
- Modify: `docs/assets/ASSET_MANIFEST.md`
- Modify: `docs/assets/SCENE_ASSET_MAPPING.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`
- Modify: `docs/assets/PROVENANCE.md`
- Modify: `docs/dev/DECISIONS.md`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/dev/LEARNING_LOG.md`
- Modify: `docs/dev/MILESTONES.md`

- [ ] **Step 1: 최종 파일 사실을 수집한다**

각 source/runtime의 byte, SHA-256, 1920×1080 여부와 에셋 커밋 SHA를 수집한다.

- [ ] **Step 2: 문서 책임별로 한 번씩 기록한다**

- manifest: 현 파일 규격·byte·hash·`ready`, 사람 권리·배포 승인 pending
- mapping: N0/N3/N5/변신/battle의 같은 밤과 동료 실루엣 계약; 기존 `CSS 야간 색보정` 설명 제거
- AI production log: 내장 edit 도구, 입력 파일, 최종 프롬프트, 후보 판단, 사용자 시각 승인 여부
- provenance: 편집 계보, source/runtime 경로, 권리 미확인
- decisions: `핵심 심사팀 잔류 + 마법적 시간/인식 정지` 선택과 비용 절감 이유
- implementation log: 실제 변경 파일·focused 검증. 전체 QA는 아직 pending
- learning log: “대본 시간과 창밖 광원이 같은 SSOT를 따라야 하는 이유”, 먼 실루엣 재사용이 비용을 줄이는 이유
- milestones: 공동 야근 연속성 단계 상태

- [ ] **Step 3: 과거 사실과 현재 상태를 구분한다**

```powershell
rg -n "CSS 야간|마지막까지 남은|주변에는 아무도|approved|모바일.*PASS" docs/assets docs/dev
git diff --check
```

Expected: 역사 기록은 superseded로 표시. 현재 상태에 모바일 PASS·`approved` 없음.

- [ ] **Step 4: 문서 커밋을 만든다**

```powershell
git add -- docs/assets/ASSET_MANIFEST.md docs/assets/SCENE_ASSET_MAPPING.md docs/assets/AI_PRODUCTION_LOG.md docs/assets/PROVENANCE.md docs/dev/DECISIONS.md docs/dev/IMPLEMENTATION_LOG.md docs/dev/LEARNING_LOG.md docs/dev/MILESTONES.md
git commit -m "docs: record late-night scene continuity"
```

---

### Task 7: 전체 자동·데스크톱 QA와 최종 기록

**Files:**
- Verify: 전체 변경 범위와 `dist/`
- Modify: `docs/dev/IMPLEMENTATION_LOG.md`
- Modify: `docs/assets/AI_PRODUCTION_LOG.md`

- [ ] **Step 1: 전체 자동 검증을 새로 실행한다**

```powershell
npm run check
npm test
npm run build
```

Expected: TypeScript 오류 0, 전체 Vitest PASS, Vite build PASS. 기존 Transformers 대형 청크 경고는 비차단 관찰로 정확히 기록한다.

- [ ] **Step 2: build 산출물 동일성을 확인한다**

7개 runtime 파일과 대응 `dist/assets/...` 파일의 SHA-256이 같은지 확인한다. 각 dist 파일은 정확히 하나여야 한다.

- [ ] **Step 3: F: worktree 개발 서버에서 1280×720 장면을 검수한다**

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

검수 순서:

```text
n0-office
n3-wraith
n5-incantation
n5-transformation cast
n5-transformation complete
battle-p1
battle-p3-spell
ending-good
```

각 장면에서 자연 크기 1920×1080, 같은 늦은 밤, 동료 존재·시간 정지, 주연/UI 가독성, overflow 0, console error 0을 확인한다. GOOD만 긴 밤 뒤 아침이어야 한다. 모바일은 검수하지 않는다.

- [ ] **Step 4: QA 증거를 기록하고 커밋한다**

- `IMPLEMENTATION_LOG.md`: check/test/build 정확한 수치, 경고, SHA, 데스크톱 장면 결과
- `AI_PRODUCTION_LOG.md`: 사람 미술 승인 상태만 기록하고 자동 실행 증거는 implementation log 링크로 참조

```powershell
git diff --check
git add -- docs/dev/IMPLEMENTATION_LOG.md docs/assets/AI_PRODUCTION_LOG.md
git commit -m "docs(qa): verify late-night scene continuity"
```

- [ ] **Step 5: 최종 범위와 clean 상태를 확인한다**

```powershell
git status --short
git log --oneline 709f56a..HEAD
git diff --check 709f56a..HEAD
git diff --stat 709f56a..HEAD
git rev-parse HEAD
```

Expected: status clean. push, PR, main merge 없음. 최종 보고에 파일 영향, 게임 화면 영향, 비용 절감, 검증 결과, 모든 신규 커밋 SHA, 남은 사람 권리·배포 게이트를 포함한다.
