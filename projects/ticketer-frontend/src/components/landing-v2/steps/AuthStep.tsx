import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, Mail, KeyRound, Check } from 'lucide-react'
import { useOnboardingStore } from '../../../store/onboardingStore'
import { Button } from '../../ui/Button'

const signupSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

type SignupValues = z.infer<typeof signupSchema>
type LoginValues = z.infer<typeof loginSchema>

const INPUT_CLASS =
  'w-full bg-transparent border-none outline-none font-body font-medium text-[18px] text-tc-white placeholder:text-tc-dim caret-tc-lime'

const Field = ({
  icon,
  hasError,
  errorMsg,
  valid,
  toggle,
  children,
}: {
  icon: React.ReactNode
  hasError: boolean
  errorMsg?: string
  valid?: boolean
  toggle?: { show: boolean; onToggle: () => void }
  children: React.ReactNode
}) => (
  <div>
    <div
      className={`relative flex items-center w-full py-3 border-b transition-colors duration-300 ${hasError ? 'border-tc-coral' : 'border-tc-border focus-within:border-tc-lime'}`}
    >
      <span className="text-tc-muted mr-3 shrink-0">{icon}</span>
      {children}
      {valid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-2 shrink-0"
        >
          <Check className="w-4 h-4 text-tc-lime" />
        </motion.div>
      )}
      {toggle && (
        <button
          type="button"
          onClick={toggle.onToggle}
          className="ml-2 text-tc-muted hover:text-tc-white transition-colors shrink-0"
        >
          {toggle.show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
    <div className="h-5">
      <AnimatePresence>
        {hasError && errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-tc-coral text-[12px] font-body mt-1"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  </div>
)

const Privacy = () => (
  <div className="flex items-center gap-1.5 text-tc-muted mt-1">
    <Lock className="w-3 h-3" />
    <span className="font-body text-[11px]">Secured & encrypted. Never shared.</span>
  </div>
)

const SubmitBtn = ({ visible, label }: { visible: boolean; label: string }) => (
  <div className="mt-8 pt-2">
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
        >
          <Button type="submit" className="w-full">
            {label} →
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

const SignupForm = ({
  onSubmit,
}: {
  onSubmit: (values: SignupValues) => void
}) => {
  const emailFromStore = useOnboardingStore((s) => s.email)
  const setEmail = useOnboardingStore((s) => s.setEmail)
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: emailFromStore, password: '', confirmPassword: '' },
    mode: 'onChange',
  })

  const emailValue = watch('email')
  useEffect(() => {
    if (emailValue) setEmail(emailValue)
  }, [emailValue, setEmail])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-1">
      <Field
        icon={<Mail className="w-4 h-4" />}
        hasError={!!errors.email}
        errorMsg={errors.email?.message as string}
        valid={!!emailValue && !errors.email}
      >
        <input
          {...register('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="you@college.edu"
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        icon={<KeyRound className="w-4 h-4" />}
        hasError={!!errors.password}
        errorMsg={errors.password?.message as string}
        toggle={{ show: showPw, onToggle: () => setShowPw(!showPw) }}
      >
        <input
          {...register('password')}
          type={showPw ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Create a password"
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        icon={<KeyRound className="w-4 h-4" />}
        hasError={!!errors.confirmPassword}
        errorMsg={errors.confirmPassword?.message as string}
        toggle={{ show: showCpw, onToggle: () => setShowCpw(!showCpw) }}
      >
        <input
          {...register('confirmPassword')}
          type={showCpw ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Confirm password"
          className={INPUT_CLASS}
        />
      </Field>

      <Privacy />
      <SubmitBtn visible={isValid} label="Create Account" />
    </form>
  )
}

const LoginForm = ({ onSubmit }: { onSubmit: (values: LoginValues) => void }) => {
  const emailFromStore = useOnboardingStore((s) => s.email)
  const setEmail = useOnboardingStore((s) => s.setEmail)
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid, errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailFromStore, password: '' },
    mode: 'onChange',
  })

  const emailValue = watch('email')
  useEffect(() => {
    if (emailValue) setEmail(emailValue)
  }, [emailValue, setEmail])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-1">
      <Field
        icon={<Mail className="w-4 h-4" />}
        hasError={!!errors.email}
        errorMsg={errors.email?.message as string}
        valid={!!emailValue && !errors.email}
      >
        <input
          {...register('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="you@college.edu"
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        icon={<KeyRound className="w-4 h-4" />}
        hasError={!!errors.password}
        errorMsg={errors.password?.message as string}
        toggle={{ show: showPw, onToggle: () => setShowPw(!showPw) }}
      >
        <input
          {...register('password')}
          type={showPw ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Your password"
          className={INPUT_CLASS}
        />
      </Field>

      <Privacy />
      <SubmitBtn visible={isValid} label="Sign In" />
    </form>
  )
}

interface AuthStepProps {
  onComplete?: () => void
}

export const AuthStep = ({ onComplete }: AuthStepProps) => {
  const name = useOnboardingStore((s) => s.name)
  const nextStep = useOnboardingStore((s) => s.nextStep)
  const setAuthMode = useOnboardingStore((s) => s.setAuthMode)
  const setPassword = useOnboardingStore((s) => s.setPassword)
  const [mode, setMode] = useState<'signup' | 'login'>(() => useOnboardingStore.getState().authMode)

  const handleAuth = () => {
    if (onComplete) {
      onComplete()
    } else {
      nextStep()
    }
  }

  const switchMode = (m: 'signup' | 'login') => {
    setMode(m)
    setAuthMode(m)
    setPassword('')
  }

  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-[1px] bg-tc-lime" />
        <span className="font-body font-semibold text-[11px] tracking-[0.2em] text-tc-lime uppercase">
          Step 02
        </span>
      </div>

      <h1 className="font-display font-extrabold text-[28px] md:text-[34px] text-tc-white leading-[1.15] mb-2">
        {mode === 'signup' ? (
          <>
            Create your account, <span className="text-tc-lime">{name}</span>
          </>
        ) : (
          <>
            Welcome back, <span className="text-tc-lime">{name}</span>
          </>
        )}
      </h1>

      <p className="font-body text-[14px] text-tc-muted mb-6 leading-relaxed">
        {mode === 'signup'
          ? "You'll use this to sign in and manage your tickets."
          : 'Sign in to pick up where you left off.'}
      </p>

      <div className="flex items-center gap-1 mb-6 bg-tc-surface rounded-lg p-1 w-full">
        {(['signup', 'login'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-md font-body font-semibold text-[13px] transition-colors duration-200 ${mode === m ? 'bg-tc-lime text-black' : 'text-tc-muted hover:text-tc-white'}`}
          >
            {m === 'signup' ? 'Sign up' : 'Log in'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'signup' ? (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <SignupForm
              onSubmit={(values) => {
                setAuthMode('signup')
                setPassword(values.password)
                handleAuth()
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <LoginForm
              onSubmit={(values) => {
                setAuthMode('login')
                setPassword(values.password)
                handleAuth()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
