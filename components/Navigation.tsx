'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, Wallet, Send, ReceiptText, ArrowRightLeft } from 'lucide-react';
import { ContextualBackButton } from '@/components/contextual-back-button';

interface NavigationProps {
  hideBrand?: boolean;
  hideBackButton?: boolean;
}

export function Navigation({ hideBrand = false, hideBackButton = false }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Send | Zelle®', href: '/send-money', icon: Send },
    { label: 'Transfer', href: '/transfer', icon: ArrowRightLeft },
    { label: 'Deposit', href: '/add-funds', icon: Wallet },
  ];

  return (
    <nav className="bg-background shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center" aria-hidden="true" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto py-2">
            {!hideBackButton && <ContextualBackButton />}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-muted/50 transition"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary hover:bg-muted/50"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {!hideBackButton && <ContextualBackButton />}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted/50 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
