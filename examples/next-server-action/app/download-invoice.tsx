'use client'

import { useTransition } from 'react'
import { generateInvoice } from './actions'

function base64ToBlob(base64: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: 'application/pdf' })
}

export function DownloadInvoice() {
  const [pending, startTransition] = useTransition()
  return (
    <form
      action={() => {
        startTransition(async () => {
          const url = URL.createObjectURL(base64ToBlob(await generateInvoice()))
          const a = document.createElement('a')
          a.href = url
          a.download = 'invoice.pdf'
          a.click()
          URL.revokeObjectURL(url)
        })
      }}
    >
      <button type="submit" disabled={pending}>
        {pending ? 'Generating…' : 'Download invoice.pdf'}
      </button>
    </form>
  )
}
