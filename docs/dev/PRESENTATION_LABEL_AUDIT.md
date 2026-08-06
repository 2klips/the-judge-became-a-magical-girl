# Production 표시 문구 점검

- 점검일: 2026-08-06
- 범위: `src/main.ts`, `src/ui/gameView.ts`의 실제 플레이 화면 문구
- 원칙: 세계관·행동 의미만 표시한다. 판정 수치, 내부 상태명, 공급자·디버그 용어는 production 화면에서 숨긴다.

## 교체·제거 완료

| 위치 | 이전 문구 | 처리 |
|---|---|---|
| 타이틀 | `VOICE VISUAL NOVEL · INPUT CHECK`, `01 / INPUT` | `목소리로 이어지는 이야기`, `마이크 준비`로 한국어화 |
| 타이틀 마이크 상태 | `READY`, `CONNECTING`, `LISTENING`, `BLOCKED` | `테스트 완료`, `연결 중`, `듣는 중`, `연결 차단` |
| 변신 주문 | `INCANTATION GATE` | `변신 주문` |
| 변신 결과 | `TRANSFORMATION`, `MOMENTUM 50/60` | `변신 완료`, 결과별 서사 문구. 수치 삭제 |
| battle 버튼 | `주문 시전 · 성공 +15`, `버티기 +3`, `{등급} 등급으로 수렴` | `주문을 외친다`, `버티기`, `계속` |
| battle 결과 | `주문 결과 momentum +N`, `주문 불발 +0`, `클릭 주문 성공 +15` | 빛·안개·목소리 중심의 서사 문장 |
| battle 음량 실패 | 정확한 dBFS와 턴 수치 | `너무 작음/큼`, 무료 재시도 여부만 표시 |
| ending 카드 | `GOOD/NORMAL/BAD ENDING`, `1/7` | `이야기의 결말`; 페이지 수 삭제. 대본의 결말 제목은 유지 |
| 오류 카드 | `DATA VALIDATION ERROR` | `데이터 확인 오류` |
| cutscene 내부 | 미사용 `progress: 3/5` 전달 | 타입·생성 코드 제거 |

## 의도적으로 유지

| 문구 | 노출 조건 | 유지 이유 |
|---|---|---|
| 마이크 테스트의 `dBFS` 숫자·레벨 그래프 | 타이틀 마이크 세팅 | 사용자가 요청한 통상 PC 게임식 마이크 테스트와 실제 음량 확인 기능 |
| `DEBUG`, scene/model/transcript/latency, momentum/grade 재현 | `?debug=1` 전용 | 다른 작업자 QA·장면 재현 기능. 일반 플레이에서는 렌더하지 않음 |
| 데이터 검증 상세 오류 목록 | 부팅 실패 | 잘못된 작가 JSON 위치와 해결 근거를 숨기지 않는 프로젝트 계약 |
| `S/A/B` 등급 문자 | battle 종료 연출 | 등급 계약 자체는 불변. 옆 문구는 세계관 표현 사용 |

## 확인 결과

- production에 STT/GPT 고정 표식·최종 transcript 본문 없음.
- production에 battle momentum 델타·판정 점수·정확한 battle dBFS 없음.
- 작가 소유 `scenario.json` 대사·선택지·분기 문구는 수정하지 않았다.
