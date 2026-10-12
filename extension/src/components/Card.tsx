import { type ComponentProps } from "react";

export interface CardProps extends ComponentProps<"div"> {
    variant: "primary" | "secondary"
}

const baseStyles = "m-6 border-2 p-3";
const variants = {
    primary: "border-stone bg-black/30",
    secondary: "border-ice bg-black/30"
}

export default function Card({ variant, children, ...props }: CardProps) {
    const combinedStyles = `${baseStyles} ${variants[variant]}`
    return (
        <div className={combinedStyles} {...props}>
            {children}
        </div>
    )
}