export function handleDerivedError() {
  return { hasError: true };
}

export const mobileMediaSubscribe = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};
export const getMobileSnapshot = () => window.innerWidth < 800;
export const getMobileServerSnapshot = () => false;

export function splitMessage(message: string) {
  const words = message.split(" ");
  const lastWord = words.pop();
  const restOfMessage = words.join(" ");
  return { restOfMessage, lastWord };
}
