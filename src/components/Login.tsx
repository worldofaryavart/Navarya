import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');

  return (
    <div className="bg-gradient-to-b from-bg-200 to-bg-300 min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="animate-fade-in grid gap-3">
        <Image
          src="/images/anthropic-logo.svg"
          alt="Anthropic Logo"
          width={184}
          height={40}
          className="text-text-000 h-8 place-self-center"
        />
        <h1 className="font-copernicus text-text-100 mb-8 mt-2 text-4xl tracking-tighter">
          Spark your creativity
        </h1>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full mx-auto animate-slide-up">
        <p className="text-lg mb-4">Start using Claude for yourself or your team</p>
        <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded w-full mb-4 flex items-center justify-center">
          <Image
            src="/images/google-logo.svg"
            alt="Google Logo"
            width={20}
            height={20}
            className="mr-2"
          />
          Continue with Google
        </button>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="mx-4 text-gray-500">OR</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>
        <input
          type="email"
          placeholder="name@yourcompany.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded py-2 px-4 w-full mb-4"
        />
        <button className="bg-accent-main-100 text-white py-2 px-4 rounded w-full">
          Continue with email
        </button>
        <p className="text-xs text-gray-500 mt-4">
          By continuing, you agree to Aaryavart&apos;s Consumer Terms and Usage Policy, and acknowledge their Privacy Policy.
        </p>
      </div>
      <button className="mt-8 text-accent-main-100 hover:underline">
        Learn more
      </button>
    </div>
  );
};

export default Login;