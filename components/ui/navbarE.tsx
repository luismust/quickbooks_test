"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export function Navbar() {
  const [imageError, setImageError] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {!imageError ? (
              <Image
                src="/logo1.png"
                alt="Examfy Logo"
                width={32}
                height={32}
                className="object-contain"
                onError={() => setImageError(true)}
                priority
              />
            ) : (
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">E</span>
              </div>
            )}
            <span className="font-bold text-xl text-white">Editor.io</span>
          </Link>
        </div>
      </div>
    </nav>
  )
} 