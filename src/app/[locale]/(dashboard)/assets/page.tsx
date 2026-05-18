import { MediaStudio } from '@/components/media/media-studio'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Assets',
  description: 'Gestiona tus medios y recursos visuales para Instagram',
}

export default function AssetsPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <MediaStudio />
    </div>
  )
}