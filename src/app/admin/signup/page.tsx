'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const signupSchema = z
  .object({
    companyName: z.string().min(2, 'Company name is required'),
    companyEmail: z.string().email('Please enter a valid business email'),
    companyPhone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{9,15}$/, 'Please enter a valid phone number'),
    adminName: z.string().min(2, 'Your name is required'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Only letters, numbers, and underscores allowed',
      ),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function AdminSignupPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: SignupFormValues) => {
    setGlobalError('');
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:9000/graphql',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation RegisterAdmin($email:String!,$password:String!,$name:String!,$tenantName:String!,$companyPhone:String,$username:String,$companyEmail:String){
            registerAdmin(email:$email,password:$password,name:$name,tenantName:$tenantName,companyPhone:$companyPhone,username:$username,companyEmail:$companyEmail)
          }`,
            variables: {
              email: data.companyEmail,
              password: data.password,
              name: data.adminName,
              tenantName: data.companyName,
              companyPhone: data.companyPhone,
              username: data.username,
              companyEmail: data.companyEmail,
            },
          }),
        },
      );
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      const login = await signIn('admin-credentials', {
        email: data.companyEmail,
        password: data.password,
        redirect: false,
      });
      if (login?.error)
        throw new Error('Account created, but automatic login failed.');

      router.push('/dashboard');
    } catch (err: any) {
      setGlobalError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground font-sans selection:bg-secondary selection:text-surface overflow-y-auto">
      <div className="w-full max-w-[440px] my-auto py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif leading-tight text-foreground">
            Create Workspace
          </h1>
          <p className="text-muted mt-2">
            Set up your administrator profile.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-surface border border-border p-8 rounded-none shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-danger-surface border border-danger/20 text-danger text-sm flex gap-3 items-start rounded-none"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="mt-0.5">{globalError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">
                  Company Name
                </label>
                <input
                  {...register('companyName')}
                  className={`w-full h-[44px] px-3 bg-surface-subtle border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 text-foreground ${
                    errors.companyName
                      ? 'border-danger focus:border-danger'
                      : 'border-border focus:border-foreground'
                  }`}
                />
                {errors.companyName && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] uppercase tracking-widest font-mono text-danger mt-2"
                  >
                    {errors.companyName.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">
                  Company Phone
                </label>
                <input
                  type="tel"
                  maxLength={15}
                  {...register('companyPhone', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/[^\d+]/g, '');
                    },
                  })}
                  className={`w-full h-[44px] px-3 bg-surface-subtle border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 text-foreground ${
                    errors.companyPhone
                      ? 'border-danger focus:border-danger'
                      : 'border-border focus:border-foreground'
                  }`}
                />
                {errors.companyPhone && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] uppercase tracking-widest font-mono text-danger mt-2"
                  >
                    {errors.companyPhone.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  {...register('companyEmail')}
                  className={`w-full h-[44px] px-3 bg-surface-subtle border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 text-foreground ${
                    errors.companyEmail
                      ? 'border-danger focus:border-danger'
                      : 'border-border focus:border-foreground'
                  }`}
                />
                {errors.companyEmail && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] uppercase tracking-widest font-mono text-danger mt-2"
                  >
                    {errors.companyEmail.message}
                  </motion.p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">
                    Admin Name
                  </label>
                  <input
                    {...register('adminName')}
                    className={`w-full h-[44px] px-3 bg-surface-subtle border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 text-foreground ${
                      errors.adminName
                        ? 'border-danger focus:border-danger'
                        : 'border-border focus:border-foreground'
                    }`}
                  />
                  {errors.adminName && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] uppercase tracking-widest font-mono text-danger mt-2"
                    >
                      {errors.adminName.message}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">
                    Username
                  </label>
                  <input
                    {...register('username')}
                    className={`w-full h-[44px] px-3 bg-surface-subtle border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 text-foreground ${
                      errors.username
                        ? 'border-danger focus:border-danger'
                        : 'border-border focus:border-foreground'
                    }`}
                  />
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] uppercase tracking-widest font-mono text-danger mt-2"
                    >
                      {errors.username.message}
                    </motion.p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className={`w-full h-[44px] px-3 bg-surface-subtle border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 text-foreground ${
                    errors.password
                      ? 'border-danger focus:border-danger'
                      : 'border-border focus:border-foreground'
                  }`}
                />
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] uppercase tracking-widest font-mono text-danger mt-2"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest font-mono text-muted mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className={`w-full h-[44px] px-3 bg-surface-subtle border text-sm outline-none transition-colors rounded-none placeholder:text-muted/50 text-foreground ${
                    errors.confirmPassword
                      ? 'border-danger focus:border-danger'
                      : 'border-border focus:border-foreground'
                  }`}
                />
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] uppercase tracking-widest font-mono text-danger mt-2"
                  >
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (isDirty && !isValid)}
              className="w-full h-[48px] bg-primary text-primary-foreground rounded-none hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-8 tracking-widest"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>CREATE COMPANY PROFILE</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-muted mt-8">
          Already have an account?{' '}
          <Link
            href="/admin/login"
            className="text-foreground font-medium hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
