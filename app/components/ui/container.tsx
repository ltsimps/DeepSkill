import * as React from "react"
import { cn } from "~/utils/misc"

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export function Container({
  className,
  as: Component = "div",
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    />
  )
}

export function MainContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn(
        "flex-1 py-8",
        className
      )}
      {...props}
    />
  )
}

export function SectionContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "py-12 sm:py-16",
        className
      )}
      {...props}
    />
  )
}
