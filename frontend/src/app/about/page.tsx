'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiTarget, FiAward, FiHeart } from 'react-icons/fi';

const AboutPage: React.FC = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const features = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Expert Team",
      description: "Our team consists of world-class AI researchers and engineers dedicated to pushing the boundaries of what's possible."
    },
    {
      icon: <FiTarget className="w-8 h-8" />,
      title: "Innovation Focus",
      description: "We're constantly innovating and developing cutting-edge AI solutions that solve real-world problems."
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: "Excellence",
      description: "Our commitment to excellence drives us to deliver the highest quality AI solutions to our users."
    },
    {
      icon: <FiHeart className="w-8 h-8" />,
      title: "User-Centric",
      description: "We put our users first, ensuring our AI solutions are intuitive, helpful, and ethically sound."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            About NavArya
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We are at the forefront of AI innovation, dedicated to revolutionizing the way people interact with and leverage artificial intelligence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * index }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl hover:bg-gray-700/50 transition-all duration-300"
            >
              <div className="text-blue-400 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 mb-16"
        >
          <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Our Mission
          </h2>
          <p className="text-lg text-gray-300 text-center max-w-4xl mx-auto">
            At NavArya, we're on a mission to empower minds and expand horizons. We believe in creating a world where everyone has the power to unlock innovation and creativity to grow faster than ever.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Join Us on Our Journey
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            We're building the future of AI, and we'd love for you to be part of it. Together, we can create something extraordinary.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold hover:opacity-90 transition-opacity">
            Get Started with NavArya
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
