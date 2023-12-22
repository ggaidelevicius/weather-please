'use server'

import { createHmac } from 'node:crypto'

/**
 * `getToken` generates a hexadecimal HMAC token for a given ID.
 *
 * This function creates a HMAC (Hash-based Message Authentication Code) using
 * SHA-256 hashing algorithm. It takes an ID as input, converts it to a JSON string,
 * and uses the environmental variable `OG_KEY` as the secret key for HMAC generation.
 * The generated HMAC is then converted to a hexadecimal string and returned as the token.
 *
 * @param {string} id - The identifier for which the token needs to be generated.
 * @returns {string} A hexadecimal string representing the HMAC token.
 *
 * Usage example:
 * const myToken = getToken('12345');
 */
export const getToken = (id: string): string => {
	const hmac = createHmac('sha256', process.env.OG_KEY as string)
	hmac.update(JSON.stringify({ title: id }))
	const token = hmac.digest('hex')
	return token
}

/**
 * `key` is a cryptographic key derived from the environmental variable `OG_KEY`.
 * 
 * This key is created using the Web Cryptography API. It takes the `OG_KEY` from
 * the environment variables, encodes it using TextEncoder, and then generates a
 * cryptographic key suitable for the HMAC algorithm with SHA-256 hash.
 * This key can be used for cryptographic operations like signing.
 */
export const key = crypto.subtle.importKey(
	'raw',
	new TextEncoder().encode(process.env.OG_KEY),
	{ name: 'HMAC', hash: { name: 'SHA-256' } },
	false,
	['sign'],
)

/**
 * `toHex` converts an ArrayBuffer to a hexadecimal string.
 * 
 * This function takes an ArrayBuffer (typically from cryptographic operations)
 * and converts it into a hexadecimal string. It does this by creating a Uint8Array
 * from the ArrayBuffer, then mapping each byte to its hexadecimal representation,
 * padding each byte to ensure two characters, and concatenating them into a single string.
 */
export const toHex = (arrayBuffer: ArrayBuffer) => {
	return Array.prototype.map
		.call(new Uint8Array(arrayBuffer), (n) => n.toString(16).padStart(2, '0'))
		.join('')
}
