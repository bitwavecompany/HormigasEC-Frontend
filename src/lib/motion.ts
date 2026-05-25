import type { Variants, Transition } from 'motion/react'

export const fadeSlideRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
}

export const fadeSlideRightTransition: Transition = { duration: 0.25 }

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export const fadeSlideUpTransition: Transition = { duration: 0.5, ease: 'easeOut' }

export const fadeDropIn: Variants = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
}

export const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.45, ease: [0.36, 0.07, 0.19, 0.97] },
  },
}


export const staggerItemTransition = (index: number): Transition => ({
  delay: index * 0.07,
  duration: 0.2,
})


export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}
