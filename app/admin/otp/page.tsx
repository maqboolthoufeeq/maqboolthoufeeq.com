'use client'

import { useState, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OtpPage() {
  const router = useRouter()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(i: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = char
    setDigits(next)
    setError('')
    if (char && i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...digits]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) { setError('Enter all 6 digits'); return }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid code')
        setDigits(['', '', '', '', '', ''])
        refs.current[0]?.focus()
        return
      }

      const result = await signIn('credentials', { preAuthToken: data.preAuthToken, redirect: false })
      if (result?.error) {
        setError('Sign-in failed. Please try again.')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Check your email</h1>
          <p className="text-sm text-[var(--muted)]">
            We sent a 6-digit verification code to your admin email.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-3 text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
              Localhost: use OTP <span className="font-mono font-bold">123456</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-13 text-center text-xl font-bold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                style={{ height: '52px' }}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className="w-full py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>

          <p className="text-center text-sm text-[var(--muted)]">
            <Link href="/admin/login" className="hover:text-[var(--accent)] transition-colors">
              ← Back to login
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
