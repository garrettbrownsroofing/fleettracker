'use client'
import Image from 'next/image'

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
      <Image
        src="/images/browns-logo.png"
        alt="Brown's Logo"
        width={100}
        height={100}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
