export async function afterTranscriptVisible<T>(
  transcript: string,
  revealTranscript: (transcript: string) => void | Promise<void>,
  continueTurn: () => T | Promise<T>,
): Promise<T> {
  await revealTranscript(transcript);
  return continueTurn();
}
