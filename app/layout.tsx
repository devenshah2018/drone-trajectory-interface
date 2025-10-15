// app/layout.tsx

import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

/**
 * Google Geist Sans font variable used for primary UI typography.
 *
 * @remarks
 * Loaded via next/font/google and exposed as a CSS variable for consistent typography across the app.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

/**
 * Google Geist Mono font variable used for monospaced text (e.g., code, metrics).
 *
 * @remarks
 * Loaded via next/font/google and exposed as a CSS variable for consistent monospaced styling.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/**
 * Application metadata used by Next.js for the document head and SEO.
 *
 * @remarks
 * Provides the default page title and description for the mission planning app.
 */
export const metadata: Metadata = {
  title: "Drone Flight Planner | Mission Planning",
  description: "Professional drone flight planning tool for aerial surveys and mapping missions",
}

/**
 * Root layout component that wraps all pages in the application.
 *
 * @param props - Layout props
 * @param props.children - React nodes rendered within the root layout
 * @returns The HTML document structure with global fonts and base classes applied
 * @remarks This is the Next.js root layout (server component) and sets global font variables and base styles.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
