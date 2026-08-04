export async function readWorkerJson(
  response: Response,
  serviceName: string,
): Promise<unknown> {
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new Error(
      `${serviceName} 응답이 JSON이 아닙니다 (${response.status}). Worker 연결을 확인해 주세요.`,
    );
  }

  const body = await response.text();
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error(
      `${serviceName} 응답 JSON을 해석할 수 없습니다 (${response.status}). 잠시 후 다시 시도해 주세요.`,
    );
  }
}
