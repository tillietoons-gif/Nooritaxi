import { cn } from "@/lib/utils"
import React from "react"
export function HeadingLg({ className, children }: { className?: string, children: React.ReactNode }) { return <h1 className={cn("text-3xl font-bold tracking-tight lg:text-4xl", className)}>{children}</h1> }
export function HeadingMd({ className, children }: { className?: string, children: React.ReactNode }) { return <h2 className={cn("text-xl font-semibold tracking-tight lg:text-2xl", className)}>{children}</h2> }
export function BodyLg({ className, children }: { className?: string, children: React.ReactNode }) { return <p className={cn("text-lg leading-7", className)}>{children}</p> }
export function BodyMd({ className, children }: { className?: string, children: React.ReactNode }) { return <p className={cn("text-base leading-6", className)}>{children}</p> }
export function LabelMd({ className, children }: { className?: string, children: React.ReactNode }) { return <span className={cn("text-sm font-medium leading-none", className)}>{children}</span> }
export function LabelSm({ className, children }: { className?: string, children: React.ReactNode }) { return <span className={cn("text-xs font-semibold leading-none uppercase tracking-wider", className)}>{children}</span> }
