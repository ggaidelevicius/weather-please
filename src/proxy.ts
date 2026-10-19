import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { acceptsMarkdown } from './features/landing/lib/accept-markdown'
import {
	CONTENT_SIGNAL,
	MARKDOWN_PATHS,
	type MarkdownPagePath,
	SITE_URL,
} from './features/landing/model/site'

// Serves each public page's Markdown version to clients that ask for it with
// `Accept: text/markdown`, and advertises the agent guides on every response.
export const proxy = (request: NextRequest) => {
	const pathname = request.nextUrl.pathname
	if (!isMarkdownPagePath(pathname)) return NextResponse.next()

	const markdownPath = MARKDOWN_PATHS[pathname]
	const shouldServeMarkdown =
		['GET', 'HEAD'].includes(request.method) &&
		acceptsMarkdown({ accept: request.headers.get('accept') })
	const destination = request.nextUrl.clone()
	destination.pathname = markdownPath
	destination.search = ''
	const response = shouldServeMarkdown
		? NextResponse.rewrite(destination)
		: NextResponse.next()

	response.headers.append('Vary', 'Accept')
	response.headers.set('Content-Signal', CONTENT_SIGNAL)
	response.headers.append(
		'Link',
		[
			`<${SITE_URL}${pathname}>; rel="canonical"`,
			`<${SITE_URL}${markdownPath}>; rel="alternate"; type="text/markdown"`,
			`<${SITE_URL}/llms.txt>; rel="describedby"; type="text/plain"`,
			`<${SITE_URL}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
			`<${SITE_URL}/auth.md>; rel="help"; type="text/markdown"`,
		].join(', '),
	)
	// Not every CDN keys on Accept, so keep negotiated URLs out of shared
	// caches. Next.js still caches the rendered page itself.
	response.headers.set('Cache-Control', 'private, no-store')
	response.headers.set('CDN-Cache-Control', 'no-store')
	response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')
	response.headers.set('Vercel-CDN-Cache-Control', 'no-store')
	return response
}

export const config = {
	matcher: ['/', '/privacy'],
}

const isMarkdownPagePath = (pathname: string): pathname is MarkdownPagePath =>
	Object.hasOwn(MARKDOWN_PATHS, pathname)
