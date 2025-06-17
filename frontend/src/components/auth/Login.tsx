import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signInWithEmail } from '@/utils/auth/auth';
import { FaGoogle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

type LoginProps = {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onLogin();
    } catch (error) {
      console.error('Google sign-in error:', error);
      setErrorMessage('An error occurred during Google sign-in. Please try again.');
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      onLogin();
    } catch (error) {
      console.error('Email sign-in error:', error);
      setErrorMessage('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
          Navarya
        </h1>
        <p className="text-gray-400 text-sm">
          Your Intelligent AI
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10"
      >
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-500 text-sm">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white/5 border border-white/10 backdrop-blur-sm text-white rounded-lg py-3 px-4 flex items-center justify-center space-x-2 hover:bg-white/10 transition-all duration-200"
        >
          <FaGoogle className="text-white" />
          <span>Continue with Google</span>
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#0A0A0A] text-gray-400">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg py-3 px-4 hover:opacity-90 transition-all duration-200"
          >
            Sign in
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don&apos;t have an account?{' '}
            <button 
              onClick={() => window.location.href = '/signup'}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;