"use client"

import { useRouter } from 'next/navigation';
import Signup from '../../components/Signup';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <Signup onSignup={handleSignup} />
    </div>
  );
}
