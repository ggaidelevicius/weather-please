/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const key = crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(process.env.OG_KEY),
  { name: 'HMAC', hash: { name: 'SHA-256' } },
  false,
  ['sign'],
)

const toHex = (arrayBuffer: ArrayBuffer) => {
  return Array.prototype.map
    .call(new Uint8Array(arrayBuffer), (n) => n.toString(16).padStart(2, '0'))
    .join('')
}

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const description = searchParams.get('description')
  const token = searchParams.get('token')

  const verifyToken = toHex(
    await crypto.subtle.sign(
      'HMAC',
      await key,
      new TextEncoder().encode(JSON.stringify({ title })),
    ),
  )

  if (token !== verifyToken) {
    return new Response('Invalid token', { status: 401 })
  }

  // console.log(`https://${process.env.VERCEL_URL}/fonts/Roboto-Regular.ttf`)
  // console.log(await fetch(`https://${process.env.VERCEL_URL}/fonts/Roboto-Regular.ttf`).then(res => res.arrayBuffer()))
  // console.log(await fetch(
  //   new URL(`https://${process.env.VERCEL_URL}/fonts/Roboto-Regular.ttf`, import.meta.url),
  // ).then((res) => res.arrayBuffer()))

  // const robotoRegular = await fetch(`https://${process.env.VERCEL_URL}/fonts/Roboto-Regular.ttf`).then(res => res.arrayBuffer())
  // const robotoBold = await fetch(`https://${process.env.VERCEL_URL}/fonts/Roboto-Bold.ttf`).then((res) => res.arrayBuffer())
  const favicon = await fetch(`https://${process.env.VERCEL_URL}/favicon.png`).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          padding: '5rem',
          display: 'flex',
          backgroundColor: '#1a1b1e',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
        }}
      >
        <h1
          style={{
            color: '#fff',
            fontWeight: '700',
            fontFamily: 'roboto',
            fontSize: '4rem',
            lineHeight: 1,
            maxWidth: '66%',
            marginBottom: '0.5rem',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: '#c1c2c5',
            fontSize: '2rem',
            fontFamily: 'roboto',
            lineHeight: 1.5,
            maxWidth: '66%',
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 'auto',
            marginBottom: 0,
          }}
        >
          <img
            src={favicon as unknown as string}
            alt="Weather Please logo"
            height={60}
            width={60}
            style={{ marginRight: '1rem' }}
          />
          <p
            style={{
              color: '#c1c2c5',
              fontWeight: '700',
              fontFamily: 'roboto',
              fontSize: '2.75rem',
              gap: '0.5rem',
            }}
          >
            Weather <span style={{ color: '#ea5e57' }}>Please</span>
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // fonts: [
      //   {
      //     data: robotoRegular,
      //     name: 'roboto',
      //     style: 'normal',
      //     weight: 400,
      //   },
      //   {
      //     data: robotoBold,
      //     name: 'roboto',
      //     style: 'normal',
      //     weight: 700,
      //   },
      // ],
    },
  )
}
