"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"

// Subtle per-route transition: content fades in and rises a few pixels.
// Keyed on the pathname so it replays whenever the route changes.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full flex-col gap-10"
    >
      {children}
    </motion.div>
  )
}
