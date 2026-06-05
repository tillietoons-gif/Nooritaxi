"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import React from "react"

interface AdminPageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  showBackLink?: boolean
  actions?: React.ReactNode
}

export function AdminPageHeader({
  title,
  subtitle,
  showBackLink = true,
  actions
}: AdminPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h1 className="text-3xl font-black">{title}</h1>
        {subtitle && (
          <div className="text-sm font-medium text-muted-foreground mt-1">
            {subtitle}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {showBackLink && (
          <Link href="/admin" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
            ← Back to Overview
          </Link>
        )}
      </div>
    </motion.div>
  )
}
