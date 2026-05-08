'use client'

import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

// Page transition wrapper
export function PageTransition({ children, className, ...props }: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Fade in from bottom
export function FadeIn({ children, className, delay = 0, ...props }: HTMLMotionProps<'div'> & { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Scale in with spring
export function ScaleIn({ children, className, delay = 0, ...props }: HTMLMotionProps<'div'> & { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger children
export function StaggerContainer({ children, className, ...props }: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Hover lift effect
export function HoverLift({ children, className, ...props }: HTMLMotionProps<'div'> & { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Button press effect
export function Pressable({ children, className, ...props }: HTMLMotionProps<'button'> & { children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Pulse dot (for notifications)
export function PulseDot({ className, color = 'bg-destructive' }: { className?: string; color?: string }) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', color)} />
      <span className={cn('relative inline-flex rounded-full h-2 w-2', color)} />
    </span>
  )
}