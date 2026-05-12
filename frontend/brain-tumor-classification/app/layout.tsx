import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brain Tumor Classification',
  description: 'Dual-modality brain tumor detection using CNN, ViT, and Random Forest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}