import React, { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  size: ButtonSize;
}

// update these to fit our UI as needed
const baseStyles = "m-3 border-2 border-transparent px-3 py-1 font-bold inline-flex items-center justify-center hover:brightness-110 disabled:opacity-50";
const variants = {
    primary: "bg-grass text-white border-b-dirt border-r-dirt",
    secondary: "bg-ocean text-white border-b-ice border-r-ice"
}
const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
}

export default function Button({ variant, size, children, ...props }: ButtonProps) {
    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]}`
    return (
        <button className={combinedClassName} {...props}>
            {children}
        </button>
    )
}
