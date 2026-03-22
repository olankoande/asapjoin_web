import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from './useGoogleLogin';

interface GoogleSignInButtonProps {
  onSuccess: Parameters<typeof useGoogleLogin>[0]['onSuccess'];
  onError: NonNullable<Parameters<typeof useGoogleLogin>[0]['onError']>;
}

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { buttonRef, ready, loading, disabled } = useGoogleLogin({ onSuccess, onError });

  return (
    <div className="space-y-2">
      <div className="flex min-h-11 items-center justify-center">
        <div ref={buttonRef} aria-label={t('auth.googleCta')} />
      </div>
      {!ready && (
        <p className="text-center text-xs text-muted-foreground">
          {disabled ? t('auth.googleUnavailable') : t('auth.googleLoading')}
        </p>
      )}
      {loading && (
        <p className="text-center text-xs text-muted-foreground">{t('auth.googleSigningIn')}</p>
      )}
    </div>
  );
}
