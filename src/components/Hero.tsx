import React, { useRef, useState } from 'react';
import { MessageSquare, FileText, Mic, Globe, Scale, Sparkles, ArrowRight, Play } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import LocalizedText from './LocalizedText';
import { useTranslation } from '../contexts/TranslationContext';

interface HeroProps {
  setActiveSection: (section: string) => void;
  onGetStarted: () => void;
}

const dropVariants = {
  initial: { opacity: 0, y: -120, scale: 1 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

const floatTransition = {
  y: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const Hero: React.FC<HeroProps> = ({ setActiveSection }) => {
  useTranslation(); // Ensures rerender on language change

  const heroRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [dropped, setDropped] = useState(false);

  // Start drop-in, then enable floating
  React.useEffect(() => {
    controls.start("animate").then(() => setDropped(true));
  }, [controls]);

  // When drag ends, spring back to center (x:0, y:0)
  const handleDragEnd = () => {
    controls.start({
      x: 0,
      y: 0,
      transition: { type: 'spring', stiffness: 80, damping: 26 }
    });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden pt-20"
    >
      {/* Background Elements */}
      <div className="fixed inset-0 w-screen h-screen pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-1/3 md:w-1/4 h-1/3 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-1/2 md:w-1/3 h-1/2 md:h-1/3 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] w-full h-full"></div>
      </div>

      <div className=" flex justify-center relative w-full max-w-20xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200/50 mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">
                <LocalizedText text="Powered by Advanced AI" />
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-5xl font-bold leading-tight mb-9 ">
              <i className="fa-solid fa-quote-left fa-2xs"></i>
              <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent italic">
                <LocalizedText text=" Giving hope to the hopeless," />
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent pb-6 italic">
                <LocalizedText text="voice to the voiceless " />
                <i className="fa-solid fa-quote-right fa-2xs"></i>
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl">
              <LocalizedText text="Get instant legal advice, document analysis, and form assistance in multiple Indian languages. Our advanced AI advocate helps you navigate complex legal matters with confidence." />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSection('chat')}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center"
              >
                <LocalizedText text="Ask now!" />
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSection('advocate-chat')}
                className="group bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              >
                <LocalizedText text="Chat now!" />
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '100%', label: 'Confidential' },
                { number: '10+', label: 'Languages' },
                { number: '24/7', label: 'Availability' },
                { number: '< 1 min', label: 'Response Time' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    <LocalizedText text={stat.label} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Draggable, Drop-in, Floating AI Assistant Card */}
          <motion.div
            drag
            dragConstraints={heroRef}
            dragElastic={0.65}
            onDragEnd={handleDragEnd}
            variants={dropVariants}
            initial="initial"
            animate={controls}
            whileHover={{ scale: 1.025 }}
            // Floating animation starts only after drop-in
            {...(dropped && {
              animate: {
                x: 0,
                y: [0, -10, 0, 10, 0]
              },
              transition: floatTransition
            })}
            className="relative cursor-grab active:cursor-grabbing mt-10 lg:mt-0 hidden lg:block"
            style={{ touchAction: 'none' }}
          >
            <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-8 border border-white/50 shadow-2xl select-none ">
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full animate-bounce"></div>

              {/* AI Avatar */}
              <div className="text-center mb-8">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative mx-auto w-32 h-32 mb-6"
                >
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Scale className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  <LocalizedText text="LegalSetu" />
                </h3>
                <p className="text-blue-600 font-large">
                  <LocalizedText text="Your Personal Legal Assistant" />
                </p>
              </div>
              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MessageSquare, label: 'AI Chat', color: 'from-blue-500 to-blue-600' },
                  { icon: FileText, label: 'Document Analysis', color: 'from-green-500 to-green-600' },
                  { icon: Mic, label: 'Voice Input', color: 'from-purple-500 to-purple-600' },
                  { icon: Globe, label: 'Multi-language', color: 'from-orange-500 to-orange-600' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/80 transition-all duration-300 border border-white/50"
                  >
                    <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      <LocalizedText text={feature.label} />
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Chat Preview */}
              <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <div className="flex items-center mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-600">
                    <LocalizedText text="Live Chat Preview" />
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="bg-blue-100 rounded-lg p-2 text-sm text-blue-800">
                    <LocalizedText text="How can I file a property dispute case?" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 text-sm text-gray-700">
                    <LocalizedText text="I can help you with that. Let me guide you through the process..." />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
