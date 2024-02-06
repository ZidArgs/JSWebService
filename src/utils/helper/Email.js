const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z0-9.-]{2,}/;

export function verifyEmail(value) {
    return EMAIL_PATTERN.test(value);
}
