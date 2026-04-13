export type PhaserDeviceLike = {
  os: Record<string, unknown>;
  input: Record<string, unknown>;
};

export function detectMobile(device: PhaserDeviceLike): boolean {
  const os = device.os;
  const input = device.input;

  const mobileOS = Boolean(
    os.android
    || os.iOS
    || os.iPad
    || os.iPhone
    || os.windowsPhone
  );

  const touchCapable = Boolean(input.touch);

  const coarsePointer = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches;

  const smallViewport = typeof window !== 'undefined'
    && Math.min(window.innerWidth, window.innerHeight) <= 820;

  return mobileOS || (touchCapable && (coarsePointer || smallViewport));
}
