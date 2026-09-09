'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@dissafyt/ui';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: any) => void;
  title?: string;
  subtitle?: string;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Sign In to Subscribe',
  subtitle = 'Create or sign into your Dissafyt account to link your monthly membership and enable priority booking.',
  defaultMode = 'signup',
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          onSuccess(data.session);
          onClose();
        } else {
          // If email confirmation is enabled, try signing in or inform the user
          setErrorMsg('Sign up successful! Please check your email or proceed to sign in.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          onSuccess(data.session);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md my-8">
        <Card className="border-zinc-800 bg-zinc-950 text-white shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <CardHeader className="space-y-2 pt-6">
            <div className="flex items-center space-x-2 text-amber-500 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Ace of Fyt Membership</span>
            </div>
            <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
            <CardDescription className="text-xs text-zinc-400">{subtitle}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Mode Toggle Switch */}
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className={`py-1.5 rounded-md transition ${
                  !isSignUp ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className={`py-1.5 rounded-md transition ${
                  isSignUp ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="rounded border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-300">Full Name</Label>
                    <div className="relative">
                      <Input
                        required
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-300">Mobile Phone (for Appointment SMS)</Label>
                    <Input
                      type="tel"
                      placeholder="082 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-xs text-white"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Email Address</Label>
                <Input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Password</Label>
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs py-2 mt-4"
              >
                {loading
                  ? 'Processing...'
                  : isSignUp
                  ? 'Create Account & Continue'
                  : 'Sign In & Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
