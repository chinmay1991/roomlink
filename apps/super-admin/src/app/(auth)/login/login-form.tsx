'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginSchema, LoginInput } from '@/server/validation/auth.schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formError, setFormError] = useState<string | null>(
    searchParams.get('error') === 'forbidden' ? 'Your account does not have Super Admin portal access.' : null
  )
  const [needsMfa, setNeedsMfa] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function attemptSignIn(values: LoginInput, token?: string) {
    setSubmitting(true)
    setFormError(null)
    const result = await signIn('credentials', { ...values, mfaToken: token, redirect: false })
    setSubmitting(false)

    if (result?.error === 'MFA_REQUIRED') {
      setNeedsMfa(true)
      return
    }
    if (result?.error) {
      setFormError(result.error.startsWith('Too many') ? result.error : 'Incorrect email, password, or code.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function onSubmit(values: LoginInput) {
    await attemptSignIn(values)
  }

  async function onSubmitMfa(e: React.FormEvent) {
    e.preventDefault()
    await attemptSignIn(getValues(), mfaToken)
  }

  if (needsMfa) {
    return (
      <form onSubmit={onSubmitMfa} className="space-y-4">
        <p className="text-sm text-slate-600">Enter the 6-digit code from your authenticator app.</p>
        {formError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </div>
        )}
        <div>
          <Label htmlFor="mfaToken">Authenticator code</Label>
          <Input
            id="mfaToken"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={mfaToken}
            onChange={(e) => setMfaToken(e.target.value)}
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting || mfaToken.length !== 6}>
          {submitting ? 'Verifying…' : 'Verify'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {formError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@roomlink.io" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
