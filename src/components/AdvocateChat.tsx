import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, MapPin, Clock, MessageCircle,
  Phone, Video, User, Send, ArrowLeft, MoreVertical,
  CheckCircle, Circle, Heart, Shield
} from 'lucide-react';
import LocalizedText from './LocalizedText';
import ChatHeader from './ChatHeader';

interface Advocate {
  id: number;
  full_name: string;
  specializations: string[];
  languages: string[];
  experience: number;
  consultation_fee: number;
  rating: number;
  total_consultations: number;
  is_online: boolean;
  profile_photo_url?: string;
  bio: string;
  city: string;
  state: string;
  last_seen?: string;
}

interface Message {
  id: number;
  consultation_id: number;
  sender_id: number;
  sender_type: 'user' | 'advocate';
  message: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  is_read: boolean;
}

interface Consultation {
  id: number;
  advocate_id: number;
  advocate_name: string;
  profile_photo_url?: string;
  consultation_type: string;
  fee_amount: number;
  status: string;
  started_at: string;
  chat_room_id: number;
  last_message?: string;
  last_message_time?: string;
}

const AdvocateChat: React.FC = () => {
  const [view, setView] = useState<'list' | 'chat' | 'profile'>('list');
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    specialization: '',
    language: '',
    minRating: '',
    maxFee: '',
    isOnline: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const specializations = [
    'Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law',
    'Property Law', 'Labor Law', 'Tax Law', 'Constitutional Law'
  ];

  const languages = [
    'English', 'Hindi', 'Bengali', 'Telugu', 'Tamil', 'Marathi',
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'
  ];

  useEffect(() => {
    fetchAdvocates();
    fetchConsultations();
  }, [filters]);

  useEffect(() => {
    if (activeConsultation) {
      fetchMessages(activeConsultation.id);
      const interval = setInterval(() => {
        fetchMessages(activeConsultation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConsultation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAdvocates = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/advocates?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAdvocates(data.advocates);
      }
    } catch (error) {
      console.error('Error fetching advocates:', error);
    }
  };

  const fetchConsultations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setConsultations(data.consultations);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const fetchMessages = async (consultationId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations/${consultationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const startConsultation = async (advocateId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ advocateId, consultationType: 'chat' })
      });

      const data = await response.json();
      if (data.success) {
        await fetchConsultations();
        const newConsultation = consultations.find(c => c.id === data.consultation.id);
        if (newConsultation) {
          setActiveConsultation(newConsultation);
          setView('chat');
        }
      } else {
        alert(data.error || 'Failed to start consultation');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      alert('Failed to start consultation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          consultationId: activeConsultation.id,
          message: newMessage,
          messageType: 'text'
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        fetchMessages(activeConsultation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredAdvocates = advocates.filter(advocate =>
    advocate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advocate.specializations.some(spec => 
      spec.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderAdvocateCard = (advocate: Advocate) => (
    <motion.div
      key={advocate.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            {advocate.profile_photo_url ? (
              <img
                src={advocate.profile_photo_url}
                alt={advocate.full_name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          {advocate.is_online && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{advocate.full_name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">{advocate.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">{advocate.total_consultations} consultations</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">₹{advocate.consultation_fee}</div>
              <div className="text-xs text-gray-500">per consultation</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {advocate.city}, {advocate.state}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {advocate.specializations.slice(0, 3).map((spec, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {spec}
                </span>
              ))}
              {advocate.specializations.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{advocate.specializations.length - 3} more
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{advocate.bio}</p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              {advocate.languages.slice(0, 3).map((lang, index) => (
                <span key={index} className="text-xs text-gray-500">{lang}</span>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedAdvocate(advocate);
                  setView('profile');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <LocalizedText text="View Profile" />
              </button>
              <button
                onClick={() => startConsultation(advocate.id)}
                disabled={!advocate.is_online || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <MessageCircle className="w-4 h-4" />
                <span><LocalizedText text="Chat Now" /></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAdvocateList = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search advocates by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.specialization}
              onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <select
              value={filters.language}
              onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <label className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl">
              <input
                type="checkbox"
                checked={filters.isOnline}
                onChange={(e) => setFilters(prev => ({ ...prev, isOnline: e.target.checked }))}
                className="rounded text-blue-600"
              />
              <span className="text-sm">Online Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Advocates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAdvocates.map(renderAdvocateCard)}
      </div>

      {filteredAdvocates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            <LocalizedText text="No advocates found" />
          </h3>
          <p className="text-gray-600">
            <LocalizedText text="Try adjusting your search criteria or filters" />
          </p>
        </div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{activeConsultation?.advocate_name}</h3>
            <p className="text-sm text-green-600">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender_type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.message}</p>
              <p className={`text-xs mt-1 ${
                message.sender_type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-white to-[#f3e8ff] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <ChatHeader
          title="Connect with Legal Experts"
          subtitle="Get instant legal advice from verified advocates"
        />

        {view === 'list' && renderAdvocateList()}
        {view === 'chat' && renderChat()}
      </motion.div>
    </div>
  );
};

export default AdvocateChat;