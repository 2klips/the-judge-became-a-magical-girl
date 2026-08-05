export async function afterVoiceAccepted<T>(
  revealAccepted: () => void | Promise<void>,
  continueTurn: () => T | Promise<T>,
): Promise<T> {
  await revealAccepted();
  return continueTurn();
}
