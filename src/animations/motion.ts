import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const NO_PREFERENCE = '(prefers-reduced-motion: no-preference)'
export const REDUCE = '(prefers-reduced-motion: reduce)'

export const prefersReducedMotion = () => window.matchMedia(REDUCE).matches

export { gsap, ScrollTrigger }
