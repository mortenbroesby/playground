const unlockedKey = 'broesby.unlocked';
const displayNameKey = 'broesby.display-name';

export function isUnlocked() {
  return window.localStorage.getItem(unlockedKey) === 'true';
}

export function unlockSession() {
  window.localStorage.setItem(unlockedKey, 'true');
}

export function clearSession() {
  window.localStorage.removeItem(unlockedKey);
  window.localStorage.removeItem(displayNameKey);
}

export function getDisplayName() {
  return window.localStorage.getItem(displayNameKey) ?? '';
}

export function setDisplayName(value: string) {
  window.localStorage.setItem(displayNameKey, value);
}
