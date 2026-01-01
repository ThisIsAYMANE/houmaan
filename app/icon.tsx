// Simple favicon using Next.js icon convention
// This file generates /favicon.ico automatically
export default function Icon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="6" fill="url(#gradient)" />
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#667eea" />
          <stop offset="1" stopColor="#764ba2" />
        </linearGradient>
      </defs>
      <text
        x="16"
        y="22"
        fontFamily="Arial, sans-serif"
        fontSize="14"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
      >
        BC
      </text>
    </svg>
  )
}

