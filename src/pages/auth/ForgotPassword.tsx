import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to request reset');
      console.log('Password reset requested for', data.email);
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
        <p className="text-sm text-muted-foreground mt-3 mb-8">
          We've sent a password reset link to your email address.
        </p>
        <Link to="/login">
          <Button variant="secondary" className="w-full">
            Return to login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot password</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

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

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </div>
  );
}
