import React from 'react';
import {
  MessageSquare,
  FileText,
  Search,
  Languages,
  Shield,
  Clock,
  Mic,
  Brain,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import LocalizedText from './LocalizedText';

interface FeaturesProps {
  onGetStarted?: () => void;
}

const Features: React.FC<FeaturesProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI Legal Chat',
      description: 'Interactive conversations with our AI advocate for instant legal guidance and advice.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: FileText,
      title: 'Document Analysis',
      description: 'Upload legal documents for AI-powered analysis and simplified explanations.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Search,
      title: 'Case Law Search',
      description: 'Access extensive database of Indian case laws and legal precedents.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Languages,
      title: 'Multi-language Support',
      description: 'Get legal assistance in 15+ Indian languages with voice and text support.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Shield,
      title: 'Form Assistance',
      description: 'Guided form filling with smart question-based data collection.',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Round-the-clock legal support whenever you need it most.',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: Mic,
      title: 'Voice Interaction',
      description: 'Speak your queries and listen to responses in your preferred language.',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      icon: Brain,
      title: 'Smart Recommendations',
      description: 'AI-powered next steps and legal action recommendations.',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  return (
    <section className="relative py-16 bg-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vw] h-96 bg-gradient-to-br from-blue-50 via-white to-green-50 opacity-60 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-8"
        >
          <Sparkles className="inline-block w-8 h-8 text-blue-500 mr-2" />
          <LocalizedText text="Platform Features" />
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                viewport={{ once: true }}
                className={`rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center ${feature.bgColor}`}
              >
                <span
                  className={`mb-4 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md`}
                >
                  <Icon className="w-7 h-7" />
                </span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {onGetStarted && (
          <div className="mt-12 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
            >
              <LocalizedText text="Get Started" />
              <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Features;
