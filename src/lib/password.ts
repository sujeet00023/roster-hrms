import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** A cryptographically random temporary password, shown once to the person creating the account. */
export function generateTempPassword(length = 12): string {
    let out = "";
    for (let i = 0; i < length; i++ ) out += ALPHABET[randomInt(ALPHABET.length)];
    return out;
}

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;