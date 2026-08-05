import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { LogOut, User, Mail, Globe, Palette, Camera } from 'lucide-react';
import { useState } from 'react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  timezone: z.string(),
  language: z.string(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function Profile() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [isSaved, setIsSaved] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      username: user?.name?.toLowerCase().replace(/\s/g, '') || '',
      timezone: 'UTC-8 (Pacific Time)',
      language: 'English (US)',
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      console.log('Profile updated', data);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mt-1 font-medium">Manage your account details and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions & Avatar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 text-center shadow-sm">
            <div className="relative inline-block mb-4">
              <Avatar 
                src={user?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name}&backgroundColor=transparent`}
                fallback={user?.name?.charAt(0) || 'U'}
                size="lg"
                className="w-28 h-28 ring-4 ring-muted shadow-sm"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="font-bold text-foreground text-lg tracking-tight">{user?.name}</h3>
            <p className="text-sm font-medium text-muted-foreground">{user?.email}</p>
            
            <div className="mt-8 pt-6 border-t border-border/60">
              <Button variant="danger" className="w-full gap-2 rounded-xl" onClick={logout}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {isSaved && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-sm font-medium flex items-center">
              Your profile has been updated successfully.
            </div>
          )}

          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-lg tracking-tight">
              <User className="w-5 h-5 text-blue-500" />
              Personal Information
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <Input 
                    {...register('name')}
                    icon={<User className="w-4 h-4" />}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                  <Input 
                    {...register('username')}
                    icon={<span className="text-muted-foreground font-medium text-sm">@</span>}
                    className={errors.username ? 'border-red-500' : ''}
                  />
                  {errors.username && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.username.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <Input 
                    {...register('email')}
                    type="email"
                    icon={<Mail className="w-4 h-4" />}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Timezone</label>
                  <Input 
                    {...register('timezone')}
                    icon={<Globe className="w-4 h-4" />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Language</label>
                  <Input 
                    {...register('language')}
                    icon={<Globe className="w-4 h-4" />}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button type="submit" isLoading={isSubmitting} className="rounded-xl px-8">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-bold text-foreground mb-6 flex items-center gap-2 text-lg tracking-tight">
              <Palette className="w-5 h-5 text-purple-500" />
              Appearance
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-4 rounded-2xl text-sm font-semibold capitalize transition-all border-2 flex flex-col items-center justify-center gap-2 ${
                    theme === t 
                      ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'bg-transparent border-border/50 text-muted-foreground hover:border-border hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full mb-1 ${
                    t === 'light' ? 'bg-white border border-gray-200' : 
                    t === 'dark' ? 'bg-gray-900 border border-gray-700' : 
                    'bg-gradient-to-br from-white to-gray-900 border border-gray-400'
                  }`} />
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
