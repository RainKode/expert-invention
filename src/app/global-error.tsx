'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          padding: '32px',
          background: '#f8f9fa',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}>
            ⚠️
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 400, margin: 0 }}>
            An unexpected error occurred. Please try again or refresh the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
