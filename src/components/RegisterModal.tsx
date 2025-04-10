import React, { useState } from 'react';
import { X } from 'lucide-react';
import { signUp, signInWithGoogle, signInWithFacebook } from '../lib/auth';
import toast from 'react-hot-toast';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error('You must accept the Terms of Use to continue');
      return;
    }
    setLoading(true);

    try {
      await signUp(email, password);
      toast.success('Verification email sent! Please check your inbox.');
      setRegistrationSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await signUp(email, password);
      toast.success('Verification email resent!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRegistration = () => {
    setRegistrationSuccess(false);
    setPassword('');
    setAcceptedTerms(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">
          {registrationSuccess ? 'Check Your Email' : 'Create an Account'}
        </h2>

        {registrationSuccess ? (
          <div className="space-y-6 text-center">
            <p className="text-gray-700">
              We've sent a verification email to <span className="font-semibold">{email}</span>.
              Please check your inbox and click the link to verify your account.
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full py-2 px-4 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>

              <button
                onClick={handleResetRegistration}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Try different method
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-2 px-4 bg-black rounded-md shadow-sm text-sm font-medium text-white hover:bg-custom-800"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => signInWithGoogle().catch((error) => toast.error(error.message))}
                className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4" />
                Google
              </button>
              <button
                type="button"
                onClick={() => signInWithFacebook().catch((error) => toast.error(error.message))}
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
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className={`focus:ring-blue-500 h-4 w-4 text-blue-600 rounded ${
                      !acceptedTerms ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700">
                    I agree to the <span className="text-red-500">*</span>{' '}
                    <a 
                      href="/terms.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Terms of Use
                    </a>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${loading ? 'bg-gray-400' : 'bg-black hover:bg-custom-800'}`}
              >
                {loading ? 'Processing...' : 'Sign Up'}
              </button>

              <p className="text-sm text-center text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Sign In
                </button>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
