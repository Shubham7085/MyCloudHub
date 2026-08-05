import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { Mail, Lock, User } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      const res = await fetch('/api/auth/register', {
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
        setError(err.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground mt-2">Join MyCloudHub to manage your files securely</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
          <Input 
            {...register('name')}
            type="text"
            placeholder="Alex Carter"
            icon={<User className="w-4 h-4" />}
            className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name.message}</p>}
        </div>

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
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <Input 
            {...register('password')}
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {errors.password && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full mt-4" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
