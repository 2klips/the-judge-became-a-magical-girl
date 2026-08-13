export function enterGameFromTitle(
  enterGame: () => void,
  disconnectMicrophone: () => Promise<void>,
): void {
  enterGame();
  void disconnectMicrophone();
}
