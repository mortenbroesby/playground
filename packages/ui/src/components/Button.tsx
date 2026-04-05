import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({
  variant = 'primary',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}
