import { useCallback, useEffect, useRef, useState } from 'react';
import { loginWithGoogleCredential } from './googleAuthApi';

const GOOGLE_GSI_SCRIPT_ID = 'google-identity-services';
const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(GOOGLE_GSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('GOOGLE_SCRIPT_LOAD_FAILED')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_GSI_SCRIPT_ID;
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GOOGLE_SCRIPT_LOAD_FAILED'));
    document.head.appendChild(script);
  });
}

interface UseGoogleLoginOptions {
  onSuccess: (session: Awaited<ReturnType<typeof loginWithGoogleCredential>>) => Promise<void> | void;
  onError?: (error: Error & { code?: string }) => void;
}

export function useGoogleLogin({ onSuccess, onError }: UseGoogleLoginOptions) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleError = useCallback((error: Error & { code?: string }) => {
    if (!mountedRef.current) return;
    setLoading(false);
    onError?.(error);
  }, [onError]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!clientId) {
        handleError(Object.assign(new Error('GOOGLE_AUTH_DISABLED'), { code: 'GOOGLE_AUTH_DISABLED' }));
        return;
      }

      try {
        await loadGoogleIdentityScript();
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!credential) {
              handleError(Object.assign(new Error('GOOGLE_POPUP_CLOSED'), { code: 'GOOGLE_POPUP_CLOSED' }));
              return;
            }

            setLoading(true);
            try {
              const session = await loginWithGoogleCredential(credential);
              await onSuccess(session);
            } catch (error) {
              handleError(error as Error & { code?: string });
            } finally {
              if (mountedRef.current) {
                setLoading(false);
              }
            }
          },
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
          logo_alignment: 'left',
        });

        if (!cancelled) {
          setReady(true);
        }
      } catch {
        handleError(Object.assign(new Error('GOOGLE_SCRIPT_LOAD_FAILED'), { code: 'GOOGLE_SCRIPT_LOAD_FAILED' }));
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, [clientId, handleError, onSuccess]);

  return {
    buttonRef,
    ready,
    loading,
    disabled: !clientId,
  };
}
