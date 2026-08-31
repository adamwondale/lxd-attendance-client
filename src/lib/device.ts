const DEVICE_KEY = 'lxd-attendance-device-signature-v1';

export function getDeviceSignature() {
  if (typeof window === 'undefined') return undefined;
  let value = window.localStorage.getItem(DEVICE_KEY);
  if (!value) {
    value = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(DEVICE_KEY, value);
  }
  return value;
}
