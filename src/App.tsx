import { useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-react';
import { SkillEditorApp } from './SkillEditorApp';
import { Analytics } from '@vercel/analytics/react';

function AuthRedirectScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 text-center">
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}

export default function App() {
  const { isLoading, signIn } = useAuth();
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const isLoginRoute = pathname === '/login';
  const isCallbackRoute = pathname === '/callback';

  useEffect(() => {
    if (!isLoginRoute) return;
    void signIn({ state: { returnTo: '/' } });
  }, [isLoginRoute, signIn]);

  if (isLoginRoute) {
    return <AuthRedirectScreen message="Redirecting to login..." />;
  }

  if (isCallbackRoute && isLoading) {
    return <AuthRedirectScreen message="Finishing sign-in..." />;
  }

  return (
    <>
      <SkillEditorApp />
      <Analytics />
    </>
  );
}
