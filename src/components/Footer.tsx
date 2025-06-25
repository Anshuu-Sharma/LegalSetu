import React from 'react';
import { Scale, Mail, Phone, MapPin, Linkedin} from 'lucide-react';
import { motion } from 'framer-motion';
import LocalizedText from './LocalizedText';

interface FooterProps {
  setActiveSection: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setActiveSection }) => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className=" w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center space-x-3"
                        >
                          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-3 rounded-2xl shadow-lg">
                            <Scale className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                              LegalSetu
                            </h1>
                          </div>
                        </motion.div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              <LocalizedText text="India’s first AI-powered legal assistant. Fast, accurate, and multilingual legal services." />
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              <LocalizedText text="Services" />
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('chat')}
                >
                  <LocalizedText text="Legal Advice" />
                </button>
              </li>
              <li>
                <button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('documents')}
                >
                  <LocalizedText text="Document Analysis" />
                </button>
              </li>
              <li>
                <button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('forms')}
                >
                  <LocalizedText text="Form Filling" />
                </button>
              </li>
              <li>
                <button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('about_us')}
                >
                  <LocalizedText text="About Us" />
                </button>
              </li>
              <li>
                <button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('advocate')}
                >
                  <LocalizedText text="Advocate" />
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Areas */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              <LocalizedText text="Legal Areas" />
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('cases')}
                >
                  <LocalizedText text="Constitution" />
                </button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              <LocalizedText text="Contact" />
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('about_us')}
                >
                  <LocalizedText text="DM us on our socials!" />
                </button>
              </div>
              <div className="flex items-center space-x-3 gap-1">
                <Phone className="w-4 h-4" />
                <LocalizedText text=" +91 7217787725" />
              </div>
              <div className="flex items-center space-x-3 gap-1">
                <MapPin className="w-4 h-4" />
                <LocalizedText text=" Delhi, India" />
              </div>
              <button
                  className="hover:underline  bg-transparent border-none p-0"
                  onClick={() => setActiveSection('easter')}
                >
                  <LocalizedText text=" Easter Egg" />
                </button>
                
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            &copy; 2025 LegalSetu. <LocalizedText text="All rights reserved." />
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors"><LocalizedText text="Privacy Policy" /></a>
            <a href="#" className="hover:text-white transition-colors"><LocalizedText text="Terms of Use" /></a>
            <a href="#" className="hover:text-white transition-colors"><LocalizedText text="Cookie Policy" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
