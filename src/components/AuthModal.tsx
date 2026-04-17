import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setError(null);
      setInfo(null);
      setLoading(false);
      setMode('signin');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!email.trim() || !password || loading) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    const { data, error: err } =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (mode === 'signup' && !data.session) {
      setInfo('Check your email to confirm your account.');
      return;
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape' && !loading) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => !loading && onClose()}
    >
      <div
        className="bg-bg-surface border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-text-primary mb-1">
          {mode === 'signin' ? 'Log in' : 'Create account'}
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {mode === 'signin'
            ? 'Sign in to keep your skills synced.'
            : 'Sign up with your email to save your skills.'}
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            autoFocus
            autoComplete="email"
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-primary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-bg-primary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {error && (
          <p className="mt-3 text-xs text-danger">{error}</p>
        )}
        {info && (
          <p className="mt-3 text-xs text-text-secondary">{info}</p>
        )}

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setInfo(null);
            }}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Log in'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !email.trim() || !password}
              className="px-3 py-1.5 text-sm rounded-md bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === 'signin' ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
