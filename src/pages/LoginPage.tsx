import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { ArrowRight, CircleUserRound } from 'lucide-react'
import { shakeVariants, fadeSlideUp, fadeSlideUpTransition } from '../lib/motion'
import LoginFieldCanvas from '../components/LoginFieldCanvas'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailInvalid = emailTouched && email.trim().length > 0 && !EMAIL_REGEX.test(email.trim())

  const handleLogin = async () => {
    if (cargando) return
    if (!email.trim() || !password) {
      toast.error('Por favor ingresa tu correo y contraseña.')
      triggerShake()
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      toast.error('Ingresa un correo electrónico válido.')
      triggerShake()
      return
    }

    setCargando(true)
    try {
      await login(email.trim(), password)
      toast.success('Bienvenido')
      navigate('/app/mapa', { replace: true })
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al iniciar sesión'
      toast.error(mensaje)
      triggerShake()
    } finally {
      setCargando(false)
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative">
      <LoginFieldCanvas antCount={10} grassDensity={4.5} antOpacityMax={0.4} leafCount={10} />
      <motion.div
        variants={fadeSlideUp}
        initial="initial"
        animate="animate"
        transition={fadeSlideUpTransition}
        className="relative z-10 bg-surface-card rounded-[32px] p-6 sm:rounded-[52px] sm:p-[32px_46px] border-[6.5px] border-white shadow-brand-lg mx-auto max-w-[455px] w-full mx-4 sm:m-[26px]"
      >
        <div className="font-display font-black text-3xl sm:text-[39px] text-brand-darker text-center">
          Inicio de Sesión
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <CircleUserRound size={48} color="rgb(22,101,52)" strokeWidth={1.5} />
        </div>

        <motion.div variants={shakeVariants} animate={shake ? 'shake' : 'idle'} className="mt-[26px]">
          <label htmlFor="email" className="block mt-5 ml-1 text-sm font-semibold text-[#444]">Correo electrónico</label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailTouched(true) }}
            onKeyDown={handleKeyDown}
            autoComplete="email"
            disabled={cargando}
            className={`login-input${emailInvalid ? ' login-input--error' : ''}`}
          />
          {emailInvalid && (
            <p className="ml-1 mt-1 text-xs text-red-500 font-medium">Ingresa un correo electrónico válido.</p>
          )}

          <label htmlFor="password" className="block mt-5 ml-1 text-sm font-semibold text-[#444]">Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              ref={passwordRef}
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              disabled={cargando}
              className="login-input"
              style={{ paddingRight: 50 }}
            />
            <button
              type="button"
              className="eye-btn"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <button onClick={handleLogin} disabled={cargando} className="btn-primary">
            <span>{cargando ? 'Autenticando...' : 'Continuar'}</span>
            {!cargando && <ArrowRight size={20} strokeWidth={2.5} />}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
