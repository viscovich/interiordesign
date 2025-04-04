import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { signIn, signInWithGoogle, signInWithFacebook } from '../lib/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      setNotification({
        type: 'success',
        message: 'Welcome back!'
      });
      onClose();
    } catch (error) {
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Authentication failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => signInWithGoogle().catch((error) => {
                setNotification({
                  type: 'error',
                  message: error.message
                });
              })}
              className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4" />
              Google
            </button>
            <button
              type="button"
              onClick={() => signInWithFacebook().catch((error) => {
                setNotification({
                  type: 'error',
                  message: error.message
                });
              })}
              className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="h-4 w-4" />
              Facebook
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {notification && (
                <div className={`mt-2 p-3 rounded-md ${
                  notification.type === 'success' 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {notification.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    <span className="text-sm">{notification.message}</span>
                  </div>
                </div>
              )}
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={async () => {
                    console.log('Forgot password clicked, email:', email);
                    if (!email) {
                      console.log('No email entered');
                      setNotification({
                        type: 'error',
                        message: 'Please enter your email address first'
                      });
                      return;
                    }

                    try {
                      console.log('Attempting to send reset email to:', email);
                      setLoading(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });

                      if (error) {
                        console.error('Reset password error:', error);
                        throw error;
                      }
                      
                      console.log('Reset email sent successfully to:', email);
                      setNotification({
                        type: 'success',
                        message: `Password reset email sent to: ${email}`
                      });
                    } catch (error) {
                      console.error('Password reset failed:', error);
                      setNotification({
                        type: 'error',
                        message: `Failed to send reset email to ${email}: ${
                          error instanceof Error ? error.message : 'Unknown error'
                        }`
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>

            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-500"
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
