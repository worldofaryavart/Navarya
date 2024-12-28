'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FiGlobe, FiTrendingUp, FiShield,FiAirplay } from 'react-icons/fi';

const VisionPage: React.FC = () => {
  const visionPoints = [
    {
      icon: <FiAirplay className="w-8 h-8" />,
      title: "Cognitive Enhancement",
      description: "Empowering individuals to reach their full intellectual potential through advanced AI assistance."
    },
    {
      icon: <FiGlobe className="w-8 h-8" />,
      title: "Global Access",
      description: "Making advanced AI technology accessible to everyone, regardless of their location or background."
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: "Continuous Innovation",
      description: "Pushing the boundaries of AI technology to create more intelligent and capable systems."
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Ethical AI",
      description: "Developing AI systems that are transparent, fair, and aligned with human values."
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
            Our Vision for the Future
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Reimagining the future of human-AI collaboration and pushing the boundaries of what's possible.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {visionPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * index }}
              className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl hover:bg-gray-700/50 transition-all duration-300"
            >
              <div className="text-blue-400 mb-4">{point.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{point.title}</h3>
              <p className="text-gray-400">{point.description}</p>
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
            Reimagining Learning and Research to grow faster than ever
          </h2>
          <div className="text-lg text-gray-300 space-y-4 max-w-4xl mx-auto">
            <p>
              Imagine having a brilliant mentor who knows everything about your field of interest, understands your learning style, and is available 24/7 to guide you. That's what we're building at NavArya.
            </p>
            <p>
              Our AI systems are designed to adapt to your unique needs, providing personalized growth metrics that evolve with you. Whether you're a startup, researcher, or professional, NavAarya is your partner in invovative growth.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="inline-block p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl mb-16">
            <div className="bg-gray-900 rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                The Future is Here
              </h2>
              <p className="text-lg text-gray-300">
                Join us in shaping the future of artificial intelligence and human potential.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center gap-4"
          >
            <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold hover:opacity-90 transition-opacity">
              Start Your Journey
            </button>
            <button className="px-8 py-3 border-2 border-blue-400 rounded-full font-semibold hover:bg-blue-400/10 transition-colors">
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VisionPage;
