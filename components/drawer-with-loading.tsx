'use client'

import { Drawer } from '@/components/ui/drawer'
import { ReactNode } from 'react'

interface DrawerWithLoadingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  description?: string
  className?: string
}

export function DrawerWithLoading({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: DrawerWithLoadingProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <div className={className}>
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        
        {children}
      </div>
    </Drawer>
  )
}
