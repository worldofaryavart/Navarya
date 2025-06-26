"use client"

import Signup from '@/components/auth/Signup';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = () => {
    router.push('/protected');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <Signup onSignup={handleSignup} />
    </div>
  );
}
