import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { getApiError } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import GoogleSignInButton from '@/features/auth/google/GoogleSignInButton';
import { Mail, Lock } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, acceptSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
      <div className="absolute top-20 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-sm space-y-8 animate-fade-in-up relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-block">
            <img src={logo} alt="AsapJoin" className="h-16 w-16 mx-auto rounded-2xl shadow-lg" />
            <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-lg -z-10" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground">{t('login.welcomeBack')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('login.subtitle')}</p>
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

          <Input
            id="email"
            label={t('login.email')}
            type="email"
            icon={Mail}
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label={t('login.password')}
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('login.submit')}
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
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-primary font-semibold hover:text-primary-dark transition-colors">
            {t('login.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
