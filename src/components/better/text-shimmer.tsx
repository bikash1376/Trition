"use client"

import { type ElementType } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

// Module-level cache: each tag's motion component is created exactly once,
// never during render (recreating it would remount and restart the animation).
const motionCache = new Map<keyof HTMLElementTagNameMap, ElementType>()

function getMotionComponent(tag: keyof HTMLElementTagNameMap): ElementType {
  let cached = motionCache.get(tag)
  if (!cached) {
    cached = motion.create(tag)
    motionCache.set(tag, cached)
  }
  return cached
}

interface TextShimmerProps {
  children: string
  as?: ElementType
  className?: string
  /** Animation duration in seconds. */
  duration?: number
  /** Width of the moving highlight, in `ch` units. */
  spread?: number
}

/**
 * TextShimmer — an animated gradient sweep across text.
 * Part of the Better Component library.
 */
export function TextShimmer({
  children,
  as: Component = "span",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  // False positive below: the module-level cache guarantees a stable identity
  // per tag, so this never remounts. The rule can't see through the cache.
  const MotionComponent = getMotionComponent(
    Component as keyof HTMLElementTagNameMap
  )
  const dynamicSpread = children.length * spread

  return (
    // eslint-disable-next-line react-hooks/static-components
    <MotionComponent
      // Remount when duration changes so the infinite loop restarts at the new
      // speed immediately (motion otherwise applies it only on the next cycle).
      key={duration}
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:var(--color-neutral-500)]",
        "[--base-gradient-color:var(--color-neutral-50)]",
        "dark:[--base-color:var(--color-neutral-400)]",
        "dark:[--base-gradient-color:var(--color-neutral-50)]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          backgroundImage:
            "var(--bg), linear-gradient(var(--base-color), var(--base-color))",
          "--bg": `linear-gradient(90deg, transparent calc(50% - ${dynamicSpread}px), var(--base-gradient-color), transparent calc(50% + ${dynamicSpread}px))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  )
}
