import { useEffect, useRef, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'

export interface MenuItem {
  label: string
  onClick: () => void
  icon?: ReactNode
  danger?: boolean
  keepOpenOnClick?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  className?: string
  onClose?: () => void
}

export default function DropdownMenu({
  trigger,
  items,
  align = 'right',
  className,
  onClose,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      onClose?.()
    }
    wasOpenRef.current = isOpen
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleItemClick = (item: MenuItem) => {
    item.onClick()
    if (!item.keepOpenOnClick) {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <div
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((v) => !v)
        }}
        className="flex items-center justify-center"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={clsx(
            'absolute bottom-full mb-2 z-50 min-w-44 bg-black border border-border rounded-xl overflow-hidden shadow-button',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => handleItemClick(item)}
              className={clsx(
                'w-full flex items-center gap-2 px-4 py-2.5 text-sm uppercase font-bold text-left transition-colors duration-150 cursor-pointer',
                item.danger
                  ? 'text-white hover:bg-[#dc2626]'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
