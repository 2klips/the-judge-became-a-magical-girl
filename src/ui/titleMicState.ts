export const TITLE_MIC_STATES = [
  "UNKNOWN",
  "REQUESTING_PERMISSION",
  "READY",
  "TESTING",
  "TEST_SUCCESS",
  "DENIED",
  "NO_DEVICE",
  "UNSUPPORTED",
  "ERROR",
] as const;

export type TitleMicState = (typeof TITLE_MIC_STATES)[number];

export type TitleMicEvent =
  | { type: "REQUEST_SETUP" }
  | { type: "PERMISSION_GRANTED" }
  | { type: "START_TEST" }
  | { type: "TEST_PASSED" }
  | { type: "PERMISSION_DENIED"; canRequestAgain: boolean }
  | { type: "NO_DEVICE" }
  | { type: "UNSUPPORTED" }
  | { type: "FAILED" }
  | { type: "DEVICE_CHANGED" }
  | { type: "RETEST" }
  | { type: "STARTED_GAME" };

export interface TitleMicPresentationContext {
  readonly deviceLabel?: string;
  readonly canRequestAgain?: boolean;
}

export interface TitleMicPresentation {
  readonly heading: string;
  readonly body: string;
  readonly action: string | null;
  readonly live: "polite";
}

export function reduceTitleMic(
  state: TitleMicState,
  event: TitleMicEvent,
): TitleMicState {
  if (event.type === "STARTED_GAME") return "UNKNOWN";
  if (event.type === "UNSUPPORTED") return "UNSUPPORTED";
  if (event.type === "NO_DEVICE") return "NO_DEVICE";
  if (event.type === "PERMISSION_DENIED") return "DENIED";
  if (event.type === "FAILED") return "ERROR";
  if (event.type === "REQUEST_SETUP" && state !== "REQUESTING_PERMISSION") {
    return "REQUESTING_PERMISSION";
  }
  if (event.type === "PERMISSION_GRANTED" && state === "REQUESTING_PERMISSION") {
    return "READY";
  }
  if (
    (event.type === "START_TEST" && state === "READY") ||
    (event.type === "RETEST" && state === "TEST_SUCCESS")
  ) {
    return "TESTING";
  }
  if (event.type === "TEST_PASSED" && state === "TESTING") return "TEST_SUCCESS";
  if (
    event.type === "DEVICE_CHANGED" &&
    (state === "READY" || state === "TESTING" || state === "TEST_SUCCESS")
  ) {
    return "READY";
  }
  return state;
}

export function isTitleMicVoiceCapable(state: TitleMicState): boolean {
  return state === "READY" || state === "TEST_SUCCESS";
}

export function presentTitleMic(
  state: TitleMicState,
  context: TitleMicPresentationContext = {},
): TitleMicPresentation {
  switch (state) {
    case "UNKNOWN":
      return {
        heading: "음성 플레이",
        body: "목소리로 대답하고 직접 주문을 외칠 수 있습니다.\n마이크 없이도 플레이할 수 있습니다.",
        action: "마이크 설정",
        live: "polite",
      };
    case "REQUESTING_PERMISSION":
      return {
        heading: "마이크 확인 중",
        body: "사용 가능한 입력 장치를 확인하고 있습니다...",
        action: null,
        live: "polite",
      };
    case "READY":
      return {
        heading: "마이크 준비됨",
        body: `${context.deviceLabel ?? "사용 가능한 마이크"}\n마이크 없이도 플레이할 수 있습니다.`,
        action: "마이크 테스트",
        live: "polite",
      };
    case "TESTING":
      return {
        heading: "목소리를 확인하고 있어요.",
        body: "평소 목소리로 한 문장을 말해주세요.\n“심사를 시작합니다.”",
        action: null,
        live: "polite",
      };
    case "TEST_SUCCESS":
      return {
        heading: "테스트 완료",
        body: "목소리가 정상적으로 확인되었습니다.",
        action: "다시 테스트",
        live: "polite",
      };
    case "DENIED":
      return context.canRequestAgain
        ? {
            heading: "마이크가 꺼져 있습니다.",
            body: "음성 플레이를 사용하려면 마이크 권한이 필요합니다.",
            action: "마이크 설정 안내",
            live: "polite",
          }
        : {
            heading: "마이크가 꺼져 있습니다.",
            body: "주소창의 사이트 설정에서 마이크 권한을 허용한 뒤 다시 확인해 주세요.",
            action: null,
            live: "polite",
          };
    case "NO_DEVICE":
      return {
        heading: "사용 가능한 마이크가 없습니다.",
        body: "마이크를 연결한 뒤 다시 확인하거나 마이크 없이 플레이할 수 있습니다.",
        action: "다시 확인",
        live: "polite",
      };
    case "UNSUPPORTED":
      return {
        heading: "이 브라우저에서는 음성 플레이를 사용할 수 없습니다.",
        body: "마이크 없이 게임을 진행할 수 있습니다.",
        action: null,
        live: "polite",
      };
    case "ERROR":
      return {
        heading: "마이크를 확인할 수 없습니다.",
        body: "잠시 후 다시 시도하거나 마이크 없이 플레이해 주세요.",
        action: "다시 시도",
        live: "polite",
      };
  }
}
