import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Compose and merge CSS class names safely for Tailwind projects.
 *
 * @param inputs - Varargs of class values accepted by clsx (strings, arrays, objects, falsy values).
 * @returns A single merged className string with Tailwind utilities deduplicated and conflicts resolved.
 * @remarks
 * This helper uses `clsx` to normalize heterogeneous class inputs and then
 * `twMerge` to resolve conflicting Tailwind utility classes (for example when
 * multiple `p-` or `text-` utilities are provided). Use this for building
 * dynamic `className` values in React components.
 */
export function cn(...inputs: ClassValue[]) {
  // Normalize class inputs (clsx) then merge Tailwind utilities (twMerge)
  return twMerge(clsx(inputs))
}
