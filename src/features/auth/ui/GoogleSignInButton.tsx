'use client';

import { useState } from 'react';
import { createClient } from '@/shared/api/supabase/client';
// components
import { Button } from '@/shared/ui/button';

const GoogleIcon = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      // 현재 페이지에서 Google OAuth로 리다이렉트
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`, // 로그인이 완료된 후 리다이렉트할 페이지 URL
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.error('[auth] google sign-in failed:', error);
        setErrorMessage('로그인 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
    } catch (error) {
      console.error('[auth] unexpected sign-in error:', error);
      setErrorMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        aria-busy={isLoading}
        className="border-border text-foreground hover:border-primary/20 hover:bg-muted h-12 w-full cursor-pointer gap-3 rounded-lg bg-white px-5 text-sm font-semibold shadow-sm transition-all">
        <GoogleIcon />
        {isLoading ? 'Connecting...' : 'Continue with Google'}
      </Button>

      {errorMessage && (
        <p className="text-destructive text-xs" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
