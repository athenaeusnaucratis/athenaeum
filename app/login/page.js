'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Account created. Check your email if confirmation is required, then sign in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <style>{`
        .login-wrap {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 2rem;
        }
        .login-card {
          width: 100%; max-width: 380px;
          border: 1px solid var(--rule); padding: 3rem 2.5rem;
          background: var(--warm-mid);
        }
        .login-logo {
          font-family: var(--serif); font-size: 1.4rem; font-weight: 300;
          color: var(--ink); text-align: center; margin-bottom: 0.4rem;
        }
        .login-logo em { font-style: italic; color: var(--coral); }
        .login-tagline {
          font-family: var(--mono); font-size: 0.58rem; color: var(--muted);
          letter-spacing: 0.18em; text-transform: uppercase;
          text-align: center; margin-bottom: 2.5rem;
        }
        .login-field { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 1.2rem; }
        .login-field label {
          font-family: var(--mono); font-size: 0.55rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted);
        }
        .login-field input {
          font-family: var(--serif); font-size: 1rem; color: var(--ink);
          background: transparent; border: none; border-bottom: 1px solid var(--rule);
          padding: 0.4rem 0; outline: none;
          transition: border-color 0.15s;
        }
        .login-field input:focus { border-bottom-color: var(--coral); }
        .login-btn {
          font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--parchment); background: var(--coral);
          border: none; padding: 0.7rem 1.4rem; cursor: pointer; width: 100%;
          margin-top: 0.5rem; transition: background 0.15s;
        }
        .login-btn:hover { background: #c05530; }
        .login-btn:disabled { opacity: 0.5; cursor: default; }
        .login-toggle {
          font-family: var(--mono); font-size: 0.6rem; color: var(--muted);
          background: transparent; border: none; cursor: pointer;
          margin-top: 1.4rem; width: 100%; text-align: center;
        }
        .login-toggle:hover { color: var(--coral); }
        .login-error {
          font-family: var(--mono); font-size: 0.65rem; color: var(--coral);
          margin-top: 1rem; text-align: center;
        }
        .login-msg {
          font-family: var(--mono); font-size: 0.65rem; color: var(--muted);
          margin-top: 1rem; text-align: center;
        }
      `}</style>

      <div className="login-card">
        <div className="login-logo">Athenaeum <em>Deipnon</em></div>
        <div className="login-tagline">{mode === 'signup' ? 'Create account' : 'Sign in'}</div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {error && <div className="login-error">{error}</div>}
        {message && <div className="login-msg">{message}</div>}

        <button
          className="login-toggle"
          onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
        >
          {mode === 'signup' ? '← Back to sign in' : 'Need to create the admin account?'}
        </button>
      </div>
    </div>
  )
}
