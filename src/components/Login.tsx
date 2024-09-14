import React, { useState } from 'react';
import Image from 'next/image';
import { signInWithGoogle, signInWithEmail } from '../utils/auth';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';

type LoginProps = {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onLogin();
    } catch (error) {
      console.error('Google sign-in error:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      onLogin()
      // router.push('/dashboard');
    } catch (error) {
      console.error('Email sign-in error:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-500 min-h-screen flex flex-col items-center justify-center px-4 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 mb-8"
      >
        <Image
          src="/aaryaai.webp"
          alt="Aarya Logo"
          width={80}
          height={80}
          className="text-white h-auto w-auto place-self-center animate-pulse"
        />
        <h1 className="font-copernicus text-white text-4xl md:text-5xl font-bold tracking-tight px-4">
          Empower Your Learning Journey
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg shadow-2xl rounded-2xl p-6 md:p-8 max-w-md w-full mx-auto"
      >
        <p className="text-xl mb-6 text-white font-semibold">Start your journey with Claude</p>
        <button
          onClick={handleGoogleSignIn}
          className="bg-white text-gray-800 py-3 px-6 rounded-full w-full mb-6 flex items-center justify-center transition duration-300 hover:bg-gray-100 hover:shadow-lg"
        >
          <FaGoogle className="mr-2 text-blue-600" />
          Continue with Google
        </button>
        <div className="flex items-center my-6">
          <hr className="flex-grow border-t border-white opacity-30" />
          <span className="mx-4 text-white opacity-70">OR</span>
          <hr className="flex-grow border-t border-white opacity-30" />
        </div>
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="name@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg py-3 px-4 w-full text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg py-3 px-4 w-full text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            required
          />
          <button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-6 rounded-full w-full font-semibold transition duration-300 hover:shadow-lg transform hover:-translate-y-1">
            Continue with email
          </button>
        </form>
        <p className="text-xs text-white text-opacity-70 mt-6">
          By continuing, you agree to Aaryavart&apos;s Consumer Terms and Usage Policy, and acknowledge their Privacy Policy.
        </p>
      </motion.div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-8 text-white hover:underline font-semibold"
      >
        Learn more
      </motion.button>
    </div>
  );
};

export default Login;
