import { clsx } from 'clsx'
import { ButtonHTMLAttributes } from 'react'

export default function Button({
  disabled = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'bg-black rounded-full cursor-pointer border border-transparent hover:border-white transition-colors duration-250 shadow-button',
        className,
        { 'opacity-50': disabled }
      )}
      style={{ WebkitAppRegion: 'no-drag' }}
      disabled={disabled}
      {...props}
    >
      {props.children}
    </button>
  )
}
