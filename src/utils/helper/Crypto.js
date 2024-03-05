import crypto from "crypto";

const PASSWORD_ENCODE_ITERATIONS = 210000;

/**
 * Create a salt-string of the given length
 *
 * @param {number} length the salt length (defaults to 64)
 * @returns a cryptographic salt in hex
 */
export function createSalt(length = 64) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

/**
 * SHA512-Encode a given password including a salt and a result length
 *
 * @param {string} password the password to encode
 * @param {string} salt the cryptographic salt
 * @param {number} length the result hash length (defaults to 64)
 * @returns a hash value of the password in hex
 */
export function encodePassword(password, salt, length = 64) {
    return crypto.pbkdf2Sync(password, salt, PASSWORD_ENCODE_ITERATIONS, length, `sha512`).toString(`hex`);
}

/**
 * Create a token of the given length
 *
 * @param {number} length the token source length (defaults to 64)
 * @returns a cryptographic token in base64 (url safe)
 */
export function createSecureURLToken(length = 64) {
    return crypto.randomBytes(length).toString("base64url").slice(0, length);
}
