import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { getApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import GoogleSignInButton from '@/features/auth/google/GoogleSignInButton';
import { Mail, Lock, User, Phone } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, acceptSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone_number: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/search');
    } catch (err) {
      setError(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (err: Error & { code?: string }) => {
    const apiError = getApiError(err);
    const code = err.code || apiError.code;
    setError(t(`auth.errors.${code}`, { defaultValue: apiError.message }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-mesh relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-8 animate-fade-in-up relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block">
            <img src={logo} alt="AsapJoin" className="h-16 w-16 mx-auto rounded-2xl shadow-lg" />
            <div className="absolute -inset-2 bg-accent/10 rounded-3xl blur-lg -z-10" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{t('register.title')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('register.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 animate-scale-in">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 11h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input id="first_name" label={t('register.firstName')} icon={User} value={form.first_name} onChange={set('first_name')} required placeholder="Jean" />
            <Input id="last_name" label={t('register.lastName')} icon={User} value={form.last_name} onChange={set('last_name')} required placeholder="Dupont" />
          </div>
          <Input id="email" label={t('register.email')} type="email" icon={Mail} value={form.email} onChange={set('email')} required autoComplete="email" placeholder={t('login.emailPlaceholder')} />
          <Input id="phone" label={t('register.phone')} type="tel" icon={Phone} value={form.phone_number} onChange={set('phone_number')} placeholder="+1 514 000 0000" hint={t('common.optional')} />
          <Input id="password" label={t('register.password')} type="password" icon={Lock} value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" placeholder={t('register.passwordPlaceholder')} />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('register.submit')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">{t('common.or')}</span>
          </div>
        </div>

        <GoogleSignInButton
          onSuccess={async (session) => {
            acceptSession(session);
            navigate('/search');
          }}
          onError={handleGoogleError}
        />

        <p className="text-center text-sm text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-dark transition-colors">
            {t('register.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
