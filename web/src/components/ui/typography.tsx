import { cn } from "@/lib/utils"
import React from "react"

export function HeadingLg({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h1 className={cn("text-4xl md:text-6xl font-black tracking-tight lg:text-7xl font-heading", className)}>{children}</h1>
}

export function HeadingMd({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h2 className={cn("text-2xl md:text-4xl font-bold tracking-tight lg:text-5xl font-heading", className)}>{children}</h2>
}

export function HeadingSm({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h3 className={cn("text-xl md:text-2xl font-bold tracking-tight font-heading", className)}>{children}</h3>
}

export function BodyLg({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={cn("text-lg md:text-xl leading-relaxed text-muted-foreground", className)}>{children}</p>
}

export function BodyMd({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={cn("text-base leading-relaxed text-muted-foreground", className)}>{children}</p>
}

export function LabelMd({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={cn("text-sm font-semibold uppercase tracking-widest text-primary/70", className)}>{children}</span>
}

export function LabelSm({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={cn("text-xs font-bold uppercase tracking-[0.2em] text-primary/60", className)}>{children}</span>
}
