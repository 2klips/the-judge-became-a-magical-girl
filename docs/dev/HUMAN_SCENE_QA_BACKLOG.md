# Human Scene QA Backlog

- 기준일: 2026-08-21
- 기준 runtime branch: `codex/scenario-v31-runtime-composition-p1`
- 최초 기준 HEAD: `384ae1308d6d6f6755a4e1fa375a3a52aa09f717`
- 근거: 2026-08-20 사용자 전체 플레이 캡처 17장과 음성 실패 캡처 2장
- 범위: 사람 시각·음향·UX 판정. 자동 테스트와 구현 완료 여부를 사람 승인과 분리한다.

## 1. 판정 권한과 상태 계약

이 문서는 v3.1 runtime 이후 사람 장면 QA의 living SSOT다. 사용자가 같은 항목을 다시 지적하면 기존 evidence를 삭제하지 않고 최신 evidence를 누적한다. 자동 QA나 과거 문서의 `OK`와 충돌하면 최신 human QA를 우선한다.

| 상태 | 의미 |
|---|---|
| `OPEN` | 문제와 목표가 확인됐으나 구현을 시작하지 않음 |
| `IMPLEMENTED` | 구현·에셋 handoff가 반영됐으나 사람 재검수 전 |
| `HUMAN_RECHECK` | 실제 화면·음향을 사용자가 다시 확인해야 함 |
| `PASS` | 사용자 actual visual/audio QA가 승인함 |
| `DEFERRED` | 범위·일정 결정에 따라 명시적으로 연기함 |

Codex 구현 완료, 자동 테스트 PASS, screenshot 생성만으로 `PASS` 처리하지 않는다. 구현 후 `IMPLEMENTED`, 사람에게 검수 가능한 상태면 `HUMAN_RECHECK`, 사용자 승인 뒤에만 `PASS`로 변경한다.

과거 [장면별 캐릭터 이미지-대화 정합 점검](../assets/CHARACTER_IMAGE_DIALOGUE_AUDIT.md)은 2026-08-06·v2 시점의 역사적 감사다. 아래 최신 판정과 충돌하는 `OK`는 삭제하지 않고 `SUPERSEDED BY V3.1 HUMAN QA`로 취급한다.

## 2. OPEN backlog

### HQ-01 — N0~N2 Doyun emotion progression

| 필드 | 내용 |
|---|---|
| Scene/Beat | N0 게임 실행부터 N2 주노 첫 등장 전후 |
| Category | Character acting / mapping |
| User Evidence | 전체 플레이 캡처 #01~#05. 초현상을 보기 전부터 `normal_startled`가 반복됨 |
| Problem | 도윤이 계속 기겁한 상태로 보여 사건 강도가 단계적으로 올라가지 않음 |
| Desired Direction | 피곤함 → 의심/집중 → 약한 당황 → 실제 초현상에서 본격 놀람 |
| Priority | P0 |
| Implementation Status | `OPEN` |
| Human Recheck | 각 비트의 연속 감정선과 반복 sprite 여부를 full play에서 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | 과거 audit의 N0~N2 `OK`는 `SUPERSEDED BY V3.1 HUMAN QA` |

### HQ-02 — Common VN Dialogue UI

| 필드 | 내용 |
|---|---|
| Scene/Beat | 공통 dialogue·choice·narration surface |
| Category | UI design system / UX hierarchy |
| User Evidence | 캡처 #01~#08, #12, #14. dialogue box가 크고 장면별 panel·button 언어가 분리됨 |
| Problem | 화면을 과도하게 가리고 generic AI-generated UI처럼 보이며 대사·선택·입력 방식 위계가 약함 |
| Desired Direction | 낮고 간결한 공통 VN dialogue shell, 작은 speaker accent, compact choice, secondary input-mode control |
| Priority | P0 |
| Implementation Status | `OPEN` — 이번 phase 구현 제외 |
| Human Recheck | 1920×1080·1600×900·1366×768에서 readability, actor occlusion, hierarchy 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | HQ-13의 global language와 함께 Phase A에서 처리 |

### HQ-03 — Floating employee ID Doyun reaction

| 필드 | 내용 |
|---|---|
| Scene/Beat | N5 사원증이 빛나며 공중으로 떠오르는 비트 |
| Category | Character asset / acting |
| User Evidence | 캡처 #07. 도윤이 사원증을 직접 보고 반응하는 연기가 없음 |
| Problem | 핵심 초현상과 도윤 시선·몸동작이 연결되지 않음 |
| Desired Direction | 사원증을 바라보는 `surprise / disbelief`; 공포·비명·horror 금지 |
| Priority | P1 ASSET |
| Implementation Status | `OPEN` — 신규 또는 기존 asset EDIT 후속 판정 |
| Human Recheck | 시선, 손, 사원증 focal relation과 canvas compatibility 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | Visual Asset Production Phase 대상 |

### HQ-04 — Facepalm mismatch

| 필드 | 내용 |
|---|---|
| Scene/Beat | N2 후속·N5 영창 전후 facepalm 사용 장면 |
| Category | Character acting / asset remap |
| User Evidence | 캡처 #05·#07·#08. 현재 동작이 난감함보다 절망·괴로움으로 읽힘 |
| Problem | 코미디성 당황과 asset의 고통·패배 인상이 충돌 |
| Desired Direction | 한숨, 난감함, 관자놀이·이마 짚기, 얼굴과 눈의 판독 유지 |
| Priority | P1 |
| Implementation Status | `OPEN` — 기존 asset remap 또는 EDIT 여부 미결정 |
| Human Recheck | 대사별 감정과 body silhouette 정합 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | HQ-01 감정 progression과 함께 판정 |

### HQ-05 — Transformation face continuity

| 필드 | 내용 |
|---|---|
| Scene/Beat | normal/live → transform CUT01·02 → post-transform live |
| Category | Art direction / character continuity |
| User Evidence | 캡처 #09~#11. CUT에서만 얼굴 전체가 보이고 live에서 다시 눈이 가려짐 |
| Problem | 의도된 reveal보다 제작 시점이 다른 asset 불일치처럼 보임 |
| Desired Direction | 변신 전·CUT·변신 후 얼굴 공개 규칙 하나를 human/art-direction 결정으로 확정 |
| Priority | P0 ART DIRECTION |
| Implementation Status | `OPEN` — 결정 전 구현 금지 |
| Human Recheck | CUT와 N5~N8 live sprite 연속성 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | 변신 이후 얼굴 공개 유지안과 CUT 얼굴 재가림안 비교 필요 |

### HQ-06 — Transform CUT control UI

| 필드 | 내용 |
|---|---|
| Scene/Beat | Transform CUT01·02 |
| Category | Cut presentation UI |
| User Evidence | 캡처 #09·#10. 중앙 modal이 얼굴·사원증·실루엣 보상을 가림 |
| Problem | full-stage cut 위 시스템 dialog가 시각적 reward를 약화 |
| Desired Direction | 작은 caption/control 또는 낮은 edge control; focal actor·사원증 비가림 |
| Priority | P1 |
| Implementation Status | `OPEN` |
| Human Recheck | 두 CUT의 focal visibility와 CTA 발견성 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | 기존 CUT full-stage·CUT/SPRITE exclusivity는 보존 |

### HQ-07 — N5 `doyun.magical_pose` facial mismatch

| 필드 | 내용 |
|---|---|
| Scene/Beat | N5 transformed-live result |
| Category | Character asset edit |
| User Evidence | 캡처 #11. 성공 결과인데 얼굴은 절망·고통·패배로 읽힘 |
| Problem | heart-hands와 성공 copy에 facial emotion이 맞지 않음 |
| Desired Direction | body·costume·heart-hands 유지. 성공했지만 당황하고 overwhelmed된 작은 어색한 미소, 옅은 blush, 읽히는 눈 |
| Priority | P0 ASSET EDIT |
| Implementation Status | `OPEN` — `doyun.magical_pose`, NEW 0 / EDIT 1 handoff 존재 |
| Human Recheck | 성공·코미디·당황이 읽히며 despair/pain/defeat가 사라졌는지 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | [ASSET_MANIFEST handoff](../assets/ASSET_MANIFEST.md#n5-변신-결과-visual-production-handoff). `RECONFIRMED BY FULL PLAY HUMAN QA` |

### HQ-08 — Confrontation composition

| 필드 | 내용 |
|---|---|
| Scene/Beat | 회색 망령 대치, N5 transformed-live, battle lead-in |
| Category | Scene composition |
| User Evidence | 캡처 #06·#11·#12와 손그림 #17 |
| Problem | enemy와 hero의 시선·대립축이 약하고 Juno support affiliation이 흐림 |
| Desired Direction | Wraith LEFT/CENTER-LEFT·대형·RIGHT-facing, Doyun RIGHT·LEFT-facing, Juno는 Doyun 측 center-low/right-low support |
| Priority | P0 |
| Implementation Status | `OPEN` — 기존 no-overlap baseline 위 재검수 |
| Human Recheck | enemy↔hero axis, support triangle, face/staff/core occlusion 0 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | 손그림은 비율·디자인이 아니라 `enemy ↔ hero axis + support triangle`만 참조 |

### HQ-09 — Actor inward-facing rule

| 필드 | 내용 |
|---|---|
| Scene/Beat | 화면 좌·우 가장자리 actor가 있는 모든 scene |
| Category | Global composition contract |
| User Evidence | 전체 플레이에서 바깥을 보는 actor가 몰입과 대립 방향을 끊음 |
| Problem | actor placement와 gaze direction이 독립적으로 적용됨 |
| Desired Direction | 왼쪽 actor는 오른쪽, 오른쪽 actor는 왼쪽을 향함. 의도적 외면 장면만 예외 |
| Priority | P0 GLOBAL |
| Implementation Status | `OPEN` — 향후 composition contract 후보 |
| Human Recheck | asset별 비대칭 의상·wand·글자 mirror 부작용까지 장면별 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | 자동 `scaleX` 일괄 적용 금지; Phase B에서 asset별 판정 |

### HQ-10 — Battle HUD collision

| 필드 | 내용 |
|---|---|
| Scene/Beat | battle HUD·BGM HUD·command surface |
| Category | Battle UI / safe zone |
| User Evidence | 캡처 #13. 우측 상단 battle HUD와 BGM HUD가 실제로 겹치고 하단 command가 과밀 |
| Problem | 상태·대사·주문·선택·입력 방식이 동시에 경쟁함 |
| Desired Direction | top HUD/BGM reserved safe zone, 하나의 compact command deck, narrative choice와 input-mode control 위계 분리 |
| Priority | P0 |
| Implementation Status | `OPEN` — 이번 phase redesign 제외 |
| Human Recheck | 세 desktop viewport, actor/staff/CTA 가림, scan order 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | Phase C Battle presentation 대상 |

### HQ-11 — Ending presentation

| 필드 | 내용 |
|---|---|
| Scene/Beat | GOOD/NORMAL/BAD/HIDDEN ending title·result |
| Category | Ending presentation |
| User Evidence | 캡처 #15. Juno와 ending UI가 충돌하고 중앙 대형 modal이 system dialog처럼 보임 |
| Problem | 감정적 결말이 반복되는 generic card pattern에 묻힘 |
| Desired Direction | editorial ending layout, actor와 UI 분리, background 위 hierarchy 중심 title·small CTA |
| Priority | P1 |
| Implementation Status | `OPEN` |
| Human Recheck | ending별 정서 차이, Juno 가독성, title crop 0 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | Phase C Ending presentation 대상 |

### HQ-12 — Post-credit black magical girl

| 필드 | 내용 |
|---|---|
| Scene/Beat | canonical post-credit corridor |
| Category | Missing asset / composition |
| User Evidence | 캡처 #16. 검은 마법소녀가 보이지 않고 중앙 POST-CREDIT card만 보임 |
| Problem | 후속 훅의 주체가 character가 아니라 modal이 됨 |
| Desired Direction | `ending.black_magical_girl` 실제 asset과 character-first composition. UI는 작게 후퇴 |
| Priority | P0 |
| Implementation Status | `OPEN` — binary 미제작; debug missing label만 구현됨 |
| Human Recheck | “누구지?”라는 인물 훅, corridor depth, title/CTA 비가림 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | black magical girl cut·post-credit incomplete. `RECONFIRMED BY FULL PLAY HUMAN QA` |

### HQ-13 — Overall UI/UX language

| 필드 | 내용 |
|---|---|
| Scene/Beat | dialogue, choice, incantation, battle, result, ending, post-credit 전역 |
| Category | Global UI/UX language |
| User Evidence | 전체 플레이 캡처에서 oversized panels, excessive rounded cards, generic buttons, inconsistent accent가 반복됨 |
| Problem | 장면별 독립 component처럼 보여 하나의 VN 제품 언어가 형성되지 않음 |
| Desired Direction | 공통 navy-black base, 얇은 border, 작은 radius·padding, 제한된 speaker accent, 명확한 대사 > 서사 선택 > 입력 방식 위계 |
| Priority | P0 GLOBAL |
| Implementation Status | `OPEN` — 별도 VN UI Design System Phase 필요 |
| Human Recheck | 전체 playthrough에서 장면 간 일관성, keyboard/hover/focus, actor occlusion 확인 |
| Final Status | `OPEN` |
| Related SSOT/TODO | HQ-02·HQ-06·HQ-10·HQ-11·HQ-12의 상위 design contract |

## 3. Existing TODO 연결

중복은 삭제 사유가 아니다. 기존 handoff와 새 사람 증거를 함께 유지한다.

| Existing TODO | Human QA link | 상태 |
|---|---|---|
| `doyun.magical_pose` EDIT 1 / NEW 0 | HQ-07 | `RECONFIRMED BY FULL PLAY HUMAN QA` |
| Juno `barrier/protect` | HQ-08·HQ-10 | 기존 visual production TODO 유지 |
| Juno `encourage/cast` | HQ-08·HQ-10 | 기존 visual production TODO 유지 |
| Juno `point/explain` | HQ-02·HQ-08 | 기존 visual production TODO 유지 |
| `ending.black_magical_girl` | HQ-12 | `RECONFIRMED BY FULL PLAY HUMAN QA` |
| post-credit incomplete | HQ-12 | `RECONFIRMED BY FULL PLAY HUMAN QA` |

## 4. 다음 implementation phases

1. **Phase A — VN UI Design System:** HQ-02·06·10·11·12·13의 공통 shell·hierarchy를 먼저 확정한다.
2. **Phase B — Doyun Emotion + Actor Direction/Composition:** HQ-01·03·04·05·08·09를 asset 제작 전 mapping·art-direction·composition으로 분리한다.
3. **Phase C — Battle / Ending / Post-credit Presentation:** Phase A contract 위에서 battle safe zone, ending editorial layout, post-credit character-first 구도를 구현한다.
4. **Phase D — Visual Asset Production:** 승인된 slot만 제작·편집한다. 현재 핵심은 Doyun reaction, `magical_pose` EDIT, Juno 행동 variation, black magical girl cut이다.
5. **Phase E — Full Voice + Click Human QA:** 실제 Worker, mic, BGM, click fallback을 포함해 전체 경로를 사용자 actual QA로 닫는다.

한 phase에 전 항목을 합치지 않는다. 각 항목은 구현 뒤 `IMPLEMENTED` 또는 `HUMAN_RECHECK`까지만 올리고 사용자 승인 전 `PASS`로 올리지 않는다.
