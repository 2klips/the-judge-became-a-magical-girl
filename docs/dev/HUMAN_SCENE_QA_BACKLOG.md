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
| Implementation Status | `HUMAN_RECHECK` — N0은 `normal_tired`, N1 opening/question과 N2 identity/chosen은 신규 `doyun.normal_suspicious`, N1 `want_rest`는 tired, `seek_new_fun`은 smile로 선택 매핑했다. 실제 주노 등장·망령 reveal부터 `normal_startled`를 사용한다. seated IMAGE 1은 `P2 OPTIONAL`로 import하지 않음 |
| Human Recheck | 각 비트의 연속 감정선과 반복 sprite 여부를 full play에서 확인 |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | 과거 audit의 N0~N2 `OK`는 `SUPERSEDED BY V3.1 HUMAN QA`. [v3.1 acting/direction audit](../assets/V31_ACTING_DIRECTION_AUDIT.md) |

### HQ-02 — Common VN Dialogue UI

| 필드 | 내용 |
|---|---|
| Scene/Beat | 공통 dialogue·choice·narration surface |
| Category | UI design system / UX hierarchy |
| User Evidence | 캡처 #01~#08, #12, #14. dialogue box가 크고 장면별 panel·button 언어가 분리됨 |
| Problem | 화면을 과도하게 가리고 generic AI-generated UI처럼 보이며 대사·선택·입력 방식 위계가 약함 |
| Desired Direction | 낮고 간결한 공통 VN dialogue shell, 작은 speaker accent, compact choice, secondary input-mode control |
| Priority | P0 |
| Implementation Status | `HUMAN_RECHECK` — Phase A/A.1 공통 VN foundation은 사용자 승인 유지. 2026-08-23 actual play에서 일반 대화의 `계속 ›`가 본문 flow에 따라 이동하는 회귀를 확인해 모든 core dialogue shell의 우하단 고정 슬롯으로 수정 |
| Human Recheck | body copy·화자·회신 길이가 달라도 `계속 ›` 위치가 동일하고 본문과 겹치지 않는지 확인. 기존 2026-08-22 `APPROVED / FREEZE` 범위의 나머지 UI는 유지 |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | HQ-13 공통 foundation과 함께 구현. HQ-06·10·11·12 scene-specific redesign은 계속 `OPEN` |

### HQ-03 — Floating employee ID Doyun reaction

| 필드 | 내용 |
|---|---|
| Scene/Beat | N5 사원증이 빛나며 공중으로 떠오르는 비트 |
| Category | Character asset / acting |
| User Evidence | 캡처 #07. 도윤이 사원증을 직접 보고 반응하는 연기가 없음 |
| Problem | 핵심 초현상과 도윤 시선·몸동작이 연결되지 않음 |
| Desired Direction | 사원증을 바라보는 `surprise / disbelief`; 공포·비명·horror 금지 |
| Priority | P1 ASSET |
| Implementation Status | `HUMAN_RECHECK` — 사용자 승인 `doyun.employee_id_surprised`를 1200×2000 투명 runtime asset으로 import하고 N5 첫 beat 전용으로 매핑했다. 기존 `normal_startled` proxy와 `NEW 1` handoff는 superseded. 2026-08-23에는 baseline `39f4370`의 반투명 magenta fringe 1,923px만 deterministic alpha cleanup하고 artifact 밖 pixel 변경 0을 검증했다 |
| Human Recheck | 실제 N5 합성에서 시선·손·사원증 focal relation과 surprise/disbelief, 머리 둘레 magenta artifact 0을 확인 |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | [v3.1 acting/direction audit](../assets/V31_ACTING_DIRECTION_AUDIT.md#2-hq-03-floating-employee-id-handoff), [asset manifest](../assets/ASSET_MANIFEST.md) |

### HQ-04 — Facepalm mismatch

| 필드 | 내용 |
|---|---|
| Scene/Beat | N2 후속·N5 영창 전후 facepalm 사용 장면 |
| Category | Character acting / asset remap |
| User Evidence | 캡처 #05·#07·#08. 현재 동작이 난감함보다 절망·괴로움으로 읽힘 |
| Problem | 코미디성 당황과 asset의 고통·패배 인상이 충돌 |
| Desired Direction | 한숨, 난감함, 관자놀이·이마 짚기, 얼굴과 눈의 판독 유지 |
| Priority | P1 |
| Implementation Status | `HUMAN_RECHECK` — 현재 `normal_shy` runtime use를 기존 `normal`/관계별 asset으로 전부 remap해 full facepalm occurrence 0 |
| Human Recheck | 대사별 감정과 body silhouette 정합 확인 |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | mild 관자놀이/이마 pose가 필요하다는 후속 사람 결정이 있을 때만 `normal_shy` EDIT 1 후보. [audit](../assets/V31_ACTING_DIRECTION_AUDIT.md#3-hq-04-facepalm-audit) |

### HQ-05 — Transformation face continuity

| 필드 | 내용 |
|---|---|
| Scene/Beat | normal/live → transform CUT01·02 → post-transform live |
| Category | Art direction / character continuity |
| User Evidence | 캡처 #09~#11. CUT에서만 얼굴 전체가 보이고 live에서 다시 눈이 가려짐 |
| Problem | 의도된 reveal보다 제작 시점이 다른 asset 불일치처럼 보임 |
| Desired Direction | 사용자 확정 Option A: 변신 전에는 눈을 가리고, CUT01/02에서 처음 공개한 얼굴을 변신 후 N5~N8 live에서도 유지 |
| Priority | P0 ART DIRECTION |
| Implementation Status | `HUMAN_RECHECK` — 사용자 Option A 확정 후 `doyun.magical`, `magical_defend`, `magical_attack`, `magical_finish`에 target별 masked 공개 얼굴 EDIT 적용. `magical_pose`는 identity reference로만 사용하고 이번 변경에서 수정하지 않음. 네 target의 body·costume·pose·입 모양·긴장도는 baseline 유지, mask 밖 raw pixel·alpha 변경 0 |
| Human Recheck | 최종 이미지 4종의 서로 다른 행동 감정과 CUT→N5~N8 live 얼굴 연속성, 실제 battle p1·p2·N8 합성 확인 |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | [두 option 비교](../assets/V31_ACTING_DIRECTION_AUDIT.md#4-hq-05-transformation-face-continuity--human-decision-required)는 결정 이력으로 보존. [manifest handoff](../assets/ASSET_MANIFEST.md#hq-05-변신-후-공개-얼굴-continuity-handoff-2026-08-23-적용) |

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
| User Evidence | 캡처 #11 및 2026-08-23 재확인. 성공 결과인데 얼굴은 절망·고통·패배로 읽히고 머리 쪽 회색 shadow/color가 부자연스러움 |
| Problem | heart-hands와 성공 copy에 facial emotion이 맞지 않음 |
| Desired Direction | body·costume·heart-hands 유지. 성공했지만 당황하고 overwhelmed된 작은 어색한 미소, 옅은 blush, 읽히는 눈 |
| Priority | P0 ASSET EDIT |
| Implementation Status | `HUMAN_RECHECK` — `doyun.magical_pose` NEW 0 / EDIT 1 적용. 몸·costume·heart-hands·staff는 유지하고 head-only로 검은 머리, 읽히는 눈, 옅은 blush, 어색한 미소를 반영 |
| Human Recheck | 성공·코미디·당황이 읽히며 despair/pain/defeat가 사라졌는지 확인 |
| Final Status | `HUMAN_RECHECK` |
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
| Implementation Status | `HUMAN_RECHECK` — Wraith LEFT/CENTER-LEFT·screen-right, Doyun RIGHT·screen-left, Juno Doyun-side center-low support로 metadata/CSS 구도 구현. 2026-08-23 actual `n6_first_choice`에서 Wraith만 42vw/780px·80vh/860px 한도로 확대해 위협 축을 보강 |
| Human Recheck | enemy↔hero axis, support triangle, 확대된 Wraith의 face/staff/core·dialogue occlusion 0 확인 |
| Final Status | `HUMAN_RECHECK` |
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
| Implementation Status | `HUMAN_RECHECK` — asset별 mirror safety를 감사하고 Wraith 2종만 safe mirror, Doyun 13종·Juno 5종은 original-only metadata로 구현 |
| Human Recheck | asset별 비대칭 의상·wand·글자 mirror 부작용까지 장면별 확인 |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | 자동 `scaleX` 일괄 적용 금지. [asset별 판정](../assets/V31_ACTING_DIRECTION_AUDIT.md#5-facing--mirror-safety-audit) |

### HQ-10 — Battle HUD collision

| 필드 | 내용 |
|---|---|
| Scene/Beat | battle HUD·BGM HUD·command surface |
| Category | Battle UI / safe zone |
| User Evidence | 캡처 #13. 우측 상단 battle HUD와 BGM HUD가 실제로 겹치고 하단 command가 과밀. 2026-08-23 후속 1366×768 actual QA에서 dialogue/command 겹침을 닫은 뒤, 2026-08-24 수동 QA에서 `이번 언령` 정보 블록의 세로 흔들림, 우측 action baseline 불균형, baked blue glass rectangle, 중앙에 떨어진 Juno를 추가 확인 |
| Problem | 상태·대사·주문·선택·입력 방식이 동시에 경쟁하고, deck 내부 정보/행동 축과 Juno의 hero-side 관계가 약함 |
| Desired Direction | top HUD/BGM reserved safe zone, 하나의 compact command deck, 좌측 정보 top-left/우측 action vertical-center, narrative choice와 input-mode control 위계, Juno의 Doyun-side support lane |
| Priority | P0 |
| Implementation Status | `PASS / FREEZE` — 기능·responsive collision closure를 보존한 채 Battle HUD·망령 dialogue·command/result deck을 Phase A VN 언어로 정리했다. 후속으로 command/voice/second-opportunity의 좌측 brief를 top-left, 우측 action을 vertical-center로 고정하고 result copy를 독립 group으로 정렬했다. baked blue glass 영역이 있는 Battle 배경은 기존 clean office asset으로 presentation remap했으며 binary는 변경하지 않았다. Juno만 Doyun-side support lane으로 이동했다. |
| Human Recheck | 2026-08-24 사용자 최종 육안 검수에서 command deck 정렬, click/voice/result/second-opportunity, blue rectangle 제거, Doyun-side Juno lane, 1920×1080·1366×768, scroll 0, console error 0을 승인했다. |
| Final Status | `PASS / FREEZE` |
| Related SSOT/TODO | HQ-10 종료. release-blocking regression 증거 없이는 Battle presentation·composition·관련 tests를 변경하지 않는다. |

### HQ-11 — Ending presentation

| 필드 | 내용 |
|---|---|
| Scene/Beat | GOOD/NORMAL/BAD ending title·result |
| Category | Ending presentation |
| User Evidence | 캡처 #15. Juno와 ending UI가 충돌하고 중앙 대형 modal이 system dialog처럼 보임 |
| Problem | 감정적 결말이 반복되는 generic card pattern에 묻힘 |
| Desired Direction | editorial ending layout, actor와 UI 분리, background 위 hierarchy 중심 title·small CTA |
| Priority | P1 |
| Implementation Status | `PASS / FREEZE` — 사용자 승인 fixed result frame의 geometry·독립 header/title anchor·`clamp(2.875rem, 3.4vw, 4rem)` title scale·detached CTA·actor composition을 GOOD/NORMAL/BAD에 그대로 유지한다. 2026-08-25 제출 범위 결정으로 HIDDEN node·presentation hook만 제거했으며 세 ending의 copy·조건·geometry는 변경하지 않았다. |
| Human Recheck | 2026-08-24 final HEAD `099fe59b`에서 네 ending 화면을 승인한 기록은 historical evidence로 유지한다. 현재 제출 runtime은 GOOD/NORMAL/BAD만 도달 가능하며, HIDDEN 제거 뒤 세 ending의 frozen geometry 회귀는 자동 검증하고 최종 release 화면은 `HUMAN_RECHECK`한다. |
| Final Status | `PASS / FREEZE` |
| Related SSOT/TODO | Ending frame geometry, header/title independent anchors, result title scale, detached CTA geometry, actor composition을 freeze한다. release-blocking regression 증거 없이는 추가 visual polish를 하지 않는다. HQ-12 제출 종료는 별도 `HUMAN_RECHECK`다. |

### HQ-12 — Post-credit submission closure

| 필드 | 내용 |
|---|---|
| Scene/Beat | GOOD/NORMAL/BAD ending exit |
| Category | Submission scope / terminal flow |
| User Evidence | 캡처 #16. 검은 마법소녀가 보이지 않고 중앙 POST-CREDIT card만 보임 |
| Problem | 과거 기획의 후속 훅은 미납품 character asset에 의존해 제출판에서 미완성 장면으로 보임 |
| Desired Direction | 미지의 소녀 teaser와 HIDDEN ending을 제출 runtime에서 제거하고, GOOD/NORMAL/BAD의 승인된 Result Frame에서 기존 `처음부터` 종료 동작으로 완결한다. 대체 teaser asset은 만들지 않는다. |
| Priority | P0 |
| Implementation Status | `HUMAN_RECHECK` — `post_credit`·teaser와 `ending_hidden` node/presentation을 제출 runtime에서 제거했다. 이전 HIDDEN five-condition run은 GOOD으로 수렴하고 legacy `ending_hidden`/해당 `post_credit` save도 GOOD으로 복구한다. `perfect_transform` 변신 결과·battle modifier는 유지된다. |
| Human Recheck | GOOD/NORMAL/BAD terminal·`처음부터`→N0, unknown girl/Black Magical Girl 0, broken image·stuck·console error·scroll 0을 최종 actual regression에서 확인한다. 기존 HIDDEN actual gate는 superseded다. |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | 과거 Black Magical Girl·HIDDEN 설계와 QA는 historical record로만 유지한다. legacy save compatibility 외 current runtime HIDDEN reference는 0이어야 한다. |

### HQ-13 — Overall UI/UX language

| 필드 | 내용 |
|---|---|
| Scene/Beat | dialogue, choice, incantation, battle, result, ending, post-credit 전역 |
| Category | Global UI/UX language |
| User Evidence | 전체 플레이 캡처에서 oversized panels, excessive rounded cards, generic buttons, inconsistent accent가 반복됨 |
| Problem | 장면별 독립 component처럼 보여 하나의 VN 제품 언어가 형성되지 않음 |
| Desired Direction | 공통 navy-black base, 얇은 border, 작은 radius·padding, 제한된 speaker accent, 명확한 대사 > 서사 선택 > 입력 방식 위계 |
| Priority | P0 GLOBAL |
| Implementation Status | `HUMAN_RECHECK` — core VN foundation과 HQ-10 Battle·GOOD/NORMAL/BAD HQ-11 geometry·OpenAI TITLE은 사용자 `PASS / FREEZE`. HIDDEN/teaser 제거와 voice/dialogue/도윤 boundary cleanup은 제출 closure actual 재검수 대기 |
| Human Recheck | QA debug evidence에서 전사·주문 4키워드·RMS/peak/clip, network/http 구분, 주노 직접 응답을 확인하고 production에서는 evidence DOM 0을 확인한다. |
| Final Status | `HUMAN_RECHECK` |
| Related SSOT/TODO | HQ-02·HQ-10·세 ending HQ-11 geometry 완료. HQ-06은 `OPEN`, 제출 cleanup은 `HUMAN_RECHECK` 유지 |

### HQ-14 — OpenAI submission TITLE rebrand

| 필드 | 내용 |
|---|---|
| Scene/Beat | TITLE 첫 화면 |
| Category | Branding / background asset replacement |
| User Evidence | OpenAI 제출용 타이틀 이미지를 canonical replacement input으로 직접 제공하고 기존 NHN 제출 흔적 제거를 요청 |
| Problem | 기존 `bg_title.webp`에 NHN/NH-IN/HACKATHON branding이 baked되어 OpenAI 제출 첫 화면에 노출됨 |
| Desired Direction | 제공 원본 composition·branding을 유지한 1920×1080 WebP `bg_title`; 기존 Game Start/Continue/Settings·optional mic·BGM·keyboard 계약 유지; public-visible NHN branding 0 |
| Priority | P0 SUBMISSION |
| Implementation Status | `PASS / FREEZE` — source 원본 보존, runtime replacement·hash/규격·과거 NHN hash 미참조 검증과 3개 desktop viewport actual QA 완료 |
| Human Recheck | 2026-08-24 사용자가 OpenAI 제출 TITLE을 최종 승인했다. 배경·TITLE UX는 release-blocking regression 없이는 변경하지 않는다. |
| Final Status | `PASS / FREEZE` |
| Related SSOT/TODO | 과거 NHN 원본·DEC-037 이력은 source/provenance에만 유지. TITLE CSS·UX는 실제 화면 필요 시 최소 범위만 조정 |

## 3. Existing TODO 연결

중복은 삭제 사유가 아니다. 기존 handoff와 새 사람 증거를 함께 유지한다.

| Existing TODO | Human QA link | 상태 |
|---|---|---|
| `doyun.magical_pose` EDIT 1 / NEW 0 | HQ-07 | `EDIT APPLIED · HUMAN_RECHECK` |
| Juno `barrier/protect` | HQ-08·HQ-10 | 기존 visual production TODO 유지 |
| Juno `encourage/cast` | HQ-08·HQ-10 | 기존 visual production TODO 유지 |
| Juno `point/explain` | HQ-02·HQ-08 | 기존 visual production TODO 유지 |
| `ending.black_magical_girl` | HQ-12 | `REMOVED FROM SUBMISSION RUNTIME` — 과거 기획 기록만 유지, 제작하지 않음 |
| post-credit incomplete | HQ-12 | `SUPERSEDED BY SUBMISSION CLOSURE` — teaser·HIDDEN 없이 GOOD/NORMAL/BAD에서 종료 |

## 4. 다음 implementation phases

1. **Phase A — VN UI Design System:** core VN shell·hierarchy는 사용자 승인·freeze, HQ-02 `PASS`. HQ-13은 scene-specific Phase C 범위 때문에 `HUMAN_RECHECK` 유지.
2. **Phase B — Doyun Emotion + Actor Direction/Composition:** 기존 asset mapping·facing·composition 구현 완료, HQ-01·04·08·09 사람 재검수와 HQ-03 asset·HQ-05 결정 대기.
3. **Phase C — Battle / Ending / submission exit:** Battle과 GOOD/NORMAL/BAD Result Frame은 사용자 `PASS / FREEZE`; Post-credit teaser·HIDDEN은 제출 범위에서 제거되어 최종 actual regression이 `HUMAN_RECHECK`다.
4. **Phase D — Visual Asset Production:** 승인된 slot만 제작·편집한다. Black Magical Girl은 제출 runtime 대상이 아니며 새 asset을 만들지 않는다.
5. **Phase E — Full Voice + Click Human QA:** 실제 Worker, mic, BGM, click fallback을 포함해 전체 경로를 사용자 actual QA로 닫는다.

한 phase에 전 항목을 합치지 않는다. 각 항목은 구현 뒤 `IMPLEMENTED` 또는 `HUMAN_RECHECK`까지만 올리고 사용자 승인 전 `PASS`로 올리지 않는다.
