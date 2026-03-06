'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Error')

  useEffect(() => {
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <p className="text-muted-foreground">
        {error.message || t('defaultMessage')}
      </p>
      <Button onClick={() => reset()}>{t('retry')}</Button>
    </div>
  )
}
