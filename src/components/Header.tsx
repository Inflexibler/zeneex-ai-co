'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from './Button';

interface HeaderProps {
  title?: string;
  showNav?: boolean;
}

export function Header({ title = 'ZENEX AI', showNav = true }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition">
            {title}
          </Link>

          {/* Desktop Navigation */}
          {showNav && (
            <nav className="hidden md:flex gap-8 items-center">
              <Link href="/#features" className="text-slate-300 hover:text-white transition">
                Features
              </Link>
              <Link href="/#pricing" className="text-slate-300 hover:text-white transition">
                Pricing
              </Link>
              <Link href="/docs" className="text-slate-300 hover:text-white transition">
                Docs
              </Link>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="primary" size="sm">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </nav>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white hover:text-slate-300 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && showNav && (
          <nav className="md:hidden mt-4 space-y-2 pb-4">
            <Link href="/#features" className="block text-slate-300 hover:text-white py-2 transition">
              Features
            </Link>
            <Link href="/#pricing" className="block text-slate-300 hover:text-white py-2 transition">
              Pricing
            </Link>
            <Link href="/docs" className="block text-slate-300 hover:text-white py-2 transition">
              Docs
            </Link>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" size="sm" className="flex-1">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="primary" size="sm" className="flex-1">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
