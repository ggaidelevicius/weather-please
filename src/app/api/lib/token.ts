export const key = crypto.subtle.importKey(
	'raw',
	new TextEncoder().encode(process.env.OG_KEY),
	{ name: 'HMAC', hash: { name: 'SHA-256' } },
	false,
	['sign'],
)

export const toHex = (arrayBuffer: ArrayBuffer) => {
	return Array.prototype.map
		.call(new Uint8Array(arrayBuffer), (n) => n.toString(16).padStart(2, '0'))
		.join('')
}
