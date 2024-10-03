import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-gray-900 text-white overflow-y-auto">
      <h1 className="text-4xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
        About Aaryal
      </h1>
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-lg">
          Welcome to Aaryal! We are at the forefront of AI innovation, dedicated to revolutionizing the way people interact with and leverage artificial intelligence.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-400">Our Mission</h2>
        <p>
          At Aaryal, we&apos;re on a mission to empower minds and expand horizons. We believe in creating a world where everyone has the power to unlock their full cognitive potential, accessing the collective knowledge of humanity at their fingertips.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-400">What Sets Us Apart</h2>
        <p>
          Our team of experts is passionate about developing innovative AI solutions that enhance productivity, creativity, and decision-making across various industries. We&apos;re not just building another AI tool; we&apos;re crafting an experience that seamlessly blends cutting-edge artificial intelligence with human cognition.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-400">Our Commitment</h2>
        <p>
          We believe in the power of AI to transform the world for the better, and we&apos;re committed to making this technology accessible and beneficial for everyone. Our focus is on creating tools that not only provide information but truly enhance your cognitive abilities.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-400">Join Our Journey</h2>
        <p>
          As we continue to develop and refine Aaryal, we invite you to join us on this exciting journey. Together, we&apos;re not just changing how we learn and work – we&apos;re expanding the boundaries of human potential.
        </p>
        
        <p className="text-xl font-semibold mt-8 text-center text-purple-400">
          Aaryal: Empowering Minds, Expanding Horizons
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
