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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700">
              <LocalizedText text="Comprehensive Features" />
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              <LocalizedText text="Comprehensive Legal" />
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <LocalizedText text="Solutions" />
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            <LocalizedText text="Experience the future of legal assistance with our AI-powered platform designed specifically for Indian legal system and languages." />
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                <LocalizedText text={feature.title} />
              </h3>
              <p className="text-gray-600 leading-relaxed">
                <LocalizedText text={feature.description} />
              </p>
            </motion.div>
          ))}
        </div>
          <br />  
        {onGetStarted && (
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-12 text-center text-white overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-20"></div>
          
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              <LocalizedText text="Ready to Get Started?" />
            </h3>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              <LocalizedText text="Join thousands of users who trust LegalBot AI for their legal needs. Get instant answers to your legal questions today." />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
              >
                <LocalizedText text="Start Free Trial" />
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-bold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <LocalizedText text="Watch Demo" />
              </motion.button>
            </div>
          </div>
        </motion.div>
        )}
      </div>
    </section>
  );
};

export default Features;
