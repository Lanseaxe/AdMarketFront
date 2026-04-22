export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function normalizePassword(value: string) {
  return value.trim();
}

export function normalizePasswordInput(value: string) {
  return value.replace(/^\s+/, "");
}

export function getPasswordValidationErrors(password: string) {
  const normalizedPassword = normalizePassword(password);
  const errors: string[] = [];

  if (normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    errors.push(`at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(normalizedPassword)) {
    errors.push("1 uppercase letter");
  }

  if (!/[a-z]/.test(normalizedPassword)) {
    errors.push("1 lowercase letter");
  }

  if (!/\d/.test(normalizedPassword)) {
    errors.push("1 digit");
  }

  if (!/[^A-Za-z0-9]/.test(normalizedPassword)) {
    errors.push("1 special character");
  }

  if (normalizedPassword.length > MAX_PASSWORD_LENGTH) {
    errors.push(`no more than ${MAX_PASSWORD_LENGTH} characters`);
  }

  return errors;
}

export function getPasswordValidationMessage(password: string) {
  const errors = getPasswordValidationErrors(password);
  if (errors.length === 0) return null;
  return `Password must contain ${errors.join(", ")}.`;
}
