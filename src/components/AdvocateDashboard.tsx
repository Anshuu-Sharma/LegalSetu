import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, User, Send, ArrowLeft, Phone, Video, 
  MoreVertical, Clock, Star, CheckCircle, LogOut,
  Bell, Settings, Users, Calendar, TrendingUp
} from 'lucide-react';
import LocalizedText from './LocalizedText';

interface AdvocateData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  specializations: string[];
  languages: string[];
  consultationFee: number;
  rating: number;
  totalConsultations: number;
  isOnline: boolean;
  profilePhotoUrl?: string;
}

interface Consultation {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  consultation_type: string;
  fee_amount: number;
  status: string;
  started_at: string;
  chat_room_id: number;
  last_message?: string;
  last_message_time?: string;
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

interface AdvocateDashboardProps {
  advocateData: AdvocateData;
  onLogout: () => void;
}

const AdvocateDashboard: React.FC<AdvocateDashboardProps> = ({ advocateData, onLogout }) => {
  const [view, setView] = useState<'consultations' | 'chat'>('consultations');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');

  // Helper function to safely format rating
  const formatRating = (rating: any): string => {
    if (rating === null || rating === undefined || isNaN(Number(rating))) {
      return '0.0';
    }
    return Number(rating).toFixed(1);
  };

  // Helper function to safely get number value
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return defaultValue;
    }
    return Number(value);
  };

  // Get advocate token
  const getAdvocateToken = () => {
    return localStorage.getItem('advocateToken');
  };

  useEffect(() => {
    fetchConsultations();
    // Set up polling for new consultations
    const interval = setInterval(fetchConsultations, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConsultation) {
      fetchMessages(activeConsultation.id);
      const interval = setInterval(() => {
        fetchMessages(activeConsultation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConsultation]);

  const fetchConsultations = async () => {
    try {
      const token = getAdvocateToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setConsultations(data.consultations);
        console.log('✅ Advocate consultations loaded:', data.consultations.length);
      }
    } catch (error) {
      console.error('❌ Error fetching consultations:', error);
    }
  };

  const fetchMessages = async (consultationId: number) => {
    try {
      const token = getAdvocateToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/consultations/${consultationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        console.log('📨 Advocate messages loaded:', data.messages.length);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation || sendingMessage) return;

    console.log('📤 Advocate sending message:', newMessage);
    setSendingMessage(true);
    
    // Optimistically add the message to the UI
    const tempMessage: Message = {
      id: Date.now(),
      consultation_id: activeConsultation.id,
      sender_id: advocateData.id,
      sender_type: 'advocate',
      message: newMessage,
      message_type: 'text',
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    const messageToSend = newMessage;
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const token = getAdvocateToken();
      if (!token) {
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setNewMessage(messageToSend);
        setSendingMessage(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/advocate-chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consultationId: activeConsultation.id,
          message: messageToSend,
          messageType: 'text'
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Advocate message sent successfully');
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setTimeout(() => {
          fetchMessages(activeConsultation.id);
        }, 100);
      } else {
        console.error('❌ Failed to send advocate message:', data.error);
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        setNewMessage(messageToSend);
        setError('Failed to send message: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error sending advocate message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageToSend);
      setError('Network error while sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderConsultationsList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            <LocalizedText text="Active Consultations" />
          </h2>
          <p className="text-gray-600">
            <LocalizedText text="Manage your client consultations" />
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">
              <LocalizedText text="Online" />
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span><LocalizedText text="Logout" /></span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                <LocalizedText text="Total Consultations" />
              </p>
              <p className="text-2xl font-bold text-gray-900">{safeNumber(advocateData.totalConsultations)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                <LocalizedText text="Rating" />
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatRating(advocateData.rating)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                <LocalizedText text="Active Chats" />
              </p>
              <p className="text-2xl font-bold text-gray-900">{consultations.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                <LocalizedText text="Fee per Session" />
              </p>
              <p className="text-2xl font-bold text-gray-900">₹{safeNumber(advocateData.consultationFee)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Consultations List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            <LocalizedText text="Recent Consultations" />
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {consultations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                <LocalizedText text="No consultations yet" />
              </p>
            </div>
          ) : (
            consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setActiveConsultation(consultation);
                  setView('chat');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{consultation.user_name}</h4>
                      <p className="text-sm text-gray-600">{consultation.user_email}</p>
                      {consultation.last_message && (
                        <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {consultation.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      consultation.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {consultation.status}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(consultation.started_at)}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      ₹{safeNumber(consultation.fee_amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setView('consultations');
              setActiveConsultation(null);
              setMessages([]);
              setError('');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{activeConsultation?.user_name}</h3>
            <p className="text-sm text-gray-600">{activeConsultation?.user_email}</p>
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
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              <LocalizedText text="No messages yet. Start the conversation!" />
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'advocate' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_type === 'advocate'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_type === 'advocate' ? 'text-purple-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your response..."
            disabled={sendingMessage}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingMessage ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                  {advocateData.profilePhotoUrl ? (
                    <img
                      src={advocateData.profilePhotoUrl}
                      alt={advocateData.fullName}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    <LocalizedText text="Welcome back" />, {advocateData.fullName}
                  </h1>
                  <p className="text-gray-600">
                    <LocalizedText text="Advocate Dashboard" />
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {view === 'consultations' && renderConsultationsList()}
        {view === 'chat' && renderChat()}
      </motion.div>
    </div>
  );
};

export default AdvocateDashboard;