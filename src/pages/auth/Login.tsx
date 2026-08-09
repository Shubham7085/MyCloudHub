import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to log in');
      }
      setUser(result.user);
      navigate('/');
    } catch (error: any) {
      setServerError(error.message || 'Failed to log in');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Log in to manage all your cloud storage in one place.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
          <Input
            {...register('email')}
            type="email"
            placeholder="name@company.com"
            icon={<Mail className="w-4 h-4" />}
            className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:opacity-80 transition-opacity">
              Forgot password?
            </Link>
          </div>
          <Input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.password && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:opacity-80 transition-opacity">
          Sign up
        </Link>
      </p>
    </div>
  );
}
