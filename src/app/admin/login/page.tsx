'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';
import { LoginInput } from '@/components/auth/LoginInput';
import { LoginPageShell } from '@/components/auth/LoginPageShell';

const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: 'Email or password is incorrect.',
  Default: 'Something went wrong. Try again.',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v: string) {
  if (!v) return 'Email is required.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return '';
}

function validatePassword(v: string) {
  if (!v) return 'Password is required.';
  if (v.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const urlError = searchParams.get('error');

  // Live-validate only after field has been touched (blurred or submit attempted)
  useEffect(() => {
    if (emailTouched) setEmailError(validateEmail(email));
  }, [email, emailTouched]);

  useEffect(() => {
    if (passwordTouched) setPasswordError(validatePassword(password));
  }, [password, passwordTouched]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError('');

    // Touch both fields to trigger inline errors
    setEmailTouched(true);
    setPasswordTouched(true);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      const result = await signIn('admin-credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setServerError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default);
        return;
      }

      toast.success('Signed in. Welcome back.');
      window.location.href = '/dashboard';
    } catch {
      setServerError(AUTH_ERRORS.Default);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginPageShell
      eyebrow="Administrator portal"
      title="Hulu Track"
      subtitle=""
      footer={
        <>
          First time here?{' '}
          <Link
            href="/admin/signup"
            className="text-[#1C1C1C] hover:underline underline-offset-4"
          >
            Create company profile
          </Link>
        </>
      }
    >
      {(urlError || serverError) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 border border-primary bg-primary/5"
        >
          <p className="font-mono text-[11px] text-primary uppercase tracking-wide">
            {serverError || AUTH_ERRORS[urlError ?? ''] || AUTH_ERRORS.Default}
          </p>
        </motion.div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginInput
            id="admin-email"
            label="Admin email"
            type="email"
            placeholder="coordinator@lxd.co"
            autoComplete="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setServerError('');
            }}
            onBlur={() => setEmailTouched(true)}
            error={emailError}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <LoginInput
            id="admin-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setServerError('');
            }}
            onBlur={() => setPasswordTouched(true)}
            error={passwordError}
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password?role=ADMIN"
              className="text-muted hover:text-secondary-hover text-[12px] font-sans transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </motion.div>

        <button
          type="submit"
          disabled={loading}
          className="button w-full h-11 flex items-center justify-center gap-2 bg-primary text-background font-sans font-medium text-[14px] border border-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-[150ms] hover:bg-primary-hover"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign in as admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </LoginPageShell>
  );
}
