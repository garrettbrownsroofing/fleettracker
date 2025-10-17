'use client'

interface BrownsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function BrownsLogo({ size = 'md', className = '' }: BrownsLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* White circle background */}
        <circle cx="50" cy="50" r="50" fill="white" />
        
        {/* House outline with pitched roof */}
        <path
          d="M20 40 L50 20 L80 40 L80 70 L20 70 Z"
          stroke="black"
          strokeWidth="1.5"
          fill="none"
        />
        
        {/* Chimney on left side of roof */}
        <rect x="25" y="30" width="6" height="12" fill="black" />
        
        {/* Vertical divider line */}
        <line x1="50" y1="35" x2="50" y2="75" stroke="black" strokeWidth="1" />
        
        {/* Detailed Claw Hammer - Left side */}
        <g transform="translate(15, 45)">
          {/* Hammer head with metallic gradient effect */}
          <defs>
            <linearGradient id="hammerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#E8E8E8", stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:"#C0C0C0", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#A0A0A0", stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* Main hammer head */}
          <rect x="2" y="2" width="12" height="8" fill="url(#hammerGradient)" stroke="black" strokeWidth="0.5" />
          
          {/* Claw part of hammer */}
          <path d="M14 2 L18 6 L16 8 L12 4 Z" fill="url(#hammerGradient)" stroke="black" strokeWidth="0.5" />
          <path d="M14 6 L18 10 L16 12 L12 8 Z" fill="url(#hammerGradient)" stroke="black" strokeWidth="0.5" />
          
          {/* Hammer handle */}
          <rect x="7" y="10" width="3" height="18" fill="#8B4513" stroke="black" strokeWidth="0.5" />
          
          {/* Handle grip detail */}
          <rect x="6" y="25" width="5" height="3" fill="#654321" stroke="black" strokeWidth="0.3" />
        </g>
        
        {/* Bold Red Letter B - Right side with 3D effect */}
        <g transform="translate(60, 50)">
          <defs>
            <linearGradient id="bGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#FF4444", stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:"#DC2626", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#B91C1C", stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* 3D effect shadow */}
          <text
            x="2"
            y="2"
            fontSize="28"
            fontWeight="900"
            fill="#8B0000"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-black"
          >
            B
          </text>
          
          {/* Main B with gradient */}
          <text
            x="0"
            y="0"
            fontSize="28"
            fontWeight="900"
            fill="url(#bGradient)"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-black"
          >
            B
          </text>
        </g>
      </svg>
    </div>
  )
}
