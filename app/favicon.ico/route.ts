import { NextResponse } from 'next/server'

// Serve SVG favicon for /favicon.ico requests
const svgIcon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="32" height="32" rx="6" fill="url(#gradient)"/>
<defs>
<linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
<stop stop-color="#667eea"/>
<stop offset="1" stop-color="#764ba2"/>
</linearGradient>
</defs>
<text x="16" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">BC</text>
</svg>`

export async function GET() {
  return new NextResponse(svgIcon, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}






// Serve SVG favicon for /favicon.ico requests
const svgIcon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="32" height="32" rx="6" fill="url(#gradient)"/>
<defs>
<linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
<stop stop-color="#667eea"/>
<stop offset="1" stop-color="#764ba2"/>
</linearGradient>
</defs>
<text x="16" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">BC</text>
</svg>`

export async function GET() {
  return new NextResponse(svgIcon, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}








