import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export const Button = ({ children, className = '', ...props }: ButtonProps) => {
  return (
    <button
      type="button"
      className={`px-5 py-2.5 rounded-lg font-body font-semibold text-tc-bg bg-tc-lime hover:bg-tc-lime/90 disabled:opacity-50 disabled:pointer-events-none transition-colors border border-tc-lime/30 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
