'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useErrorMessage } from '@/lib/use-validation-state'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Error')
  // Al boundary tambien llegan los errores del servidor: mostrar `error.message`
  // crudo dejaba pasar el texto en ingles de GoTrue/PostgREST (con nombres de
  // tablas y constraints) y, desde que existe AppError, la clave sin traducir.
  const toErrorMessage = useErrorMessage()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground">
        {toErrorMessage(error)}
      </p>
      <Button onClick={() => reset()}>{t('retry')}</Button>
    </div>
  )
}
