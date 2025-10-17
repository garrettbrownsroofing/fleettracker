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
        
        {/* House outline */}
        <path
          d="M25 35 L50 20 L75 35 L75 65 L25 65 Z"
          stroke="black"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Chimney */}
        <rect x="60" y="25" width="8" height="15" fill="black" />
        
        {/* Hammer */}
        <g transform="translate(20, 40)">
          {/* Hammer head */}
          <rect x="0" y="0" width="8" height="12" fill="#C0C0C0" />
          <rect x="2" y="2" width="4" height="8" fill="#A0A0A0" />
          {/* Hammer claw */}
          <path d="M8 0 L12 4 L10 6 L6 2 Z" fill="#C0C0C0" />
          {/* Hammer handle */}
          <rect x="6" y="12" width="2" height="20" fill="#8B4513" />
        </g>
        
        {/* Divider line */}
        <line x1="35" y1="40" x2="35" y2="80" stroke="black" strokeWidth="1" />
        
        {/* Letter B */}
        <g transform="translate(45, 50)">
          <text
            x="0"
            y="0"
            fontSize="32"
            fontWeight="bold"
            fill="#DC2626"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-bold"
          >
            B
          </text>
        </g>
      </svg>
    </div>
  )
}
