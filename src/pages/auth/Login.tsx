import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: import.meta.env.DEV ? 'demo@mycloudhub.com' : '',
      password: import.meta.env.DEV ? 'Demo@12345' : '',
    }
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // DEV DEMO MODE BYPASS FOR PREVIEW ENVIRONMENT
        if (import.meta.env.DEV && data.user) {
          localStorage.setItem('dev_demo_user', JSON.stringify(data.user));
        }

        await checkAuth();
        navigate('/');
      } else {
        const err = await res.json();
        setError(err.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-2">Enter your details to access your drives</p>
        {import.meta.env.DEV && (
          <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-600 dark:text-yellow-400 text-xs font-semibold uppercase tracking-wider">
            Development Mode Only - Demo Account Ready
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
          {error}
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
            <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors">
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

        <div className="flex items-center pt-2">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground font-medium">
            Remember me
          </label>
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
