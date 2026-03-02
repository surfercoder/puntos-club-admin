'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">¡Algo salió mal!</h2>
      <p className="text-muted-foreground">
        {error.message || 'Ocurrió un error inesperado'}
      </p>
      <Button onClick={() => reset()}>Intentar de nuevo</Button>
    </div>
  )
}
