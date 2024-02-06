import crypto from "crypto";

/**
 * Create a salt-string of the given length
 *
 * @param {number} length the salt length (defaults to 64)
 * @returns a cryptographic salt in hex
 */
export function createSalt(length = 64) {
    return crypto.randomBytes(length).toString("hex");
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
    return crypto.pbkdf2Sync(password, salt, 210000, length, `sha512`).toString(`hex`);
}
