// src/components/FormFilling/FormFilling.tsx
import React, { useState, useRef } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import { Upload, FileText, Mic, Volume2, Download, Check } from 'lucide-react';
import LocalizedText from '../LocalizedText';

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  rect: number[];
  page: number;
  value: string;
  required?: boolean;

}

const FormFilling: React.FC = () => {
  const { language } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadForm = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('form', file);
      formDataToSend.append('language', language);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forms/upload`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setFormId(data.formId);
        setFormFields(data.formFields);
        setImageHeight(data.imageHeight);

        const initialData: Record<string, string> = {};
        data.formFields.forEach((field: FormField) => {
          initialData[field.id] = '';
        });
        setFormData(initialData);
      } else {
        alert('Failed to process form: ' + data.error);
      }
    } catch (error) {
      console.error('Form upload error:', error);
      alert('Failed to upload form: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const speakFieldLabel = async (fieldName: string) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(fieldName);
        
        // Map language codes to BCP-47 format
        const languageMap: Record<string, string> = {
          'en': 'en-IN',
          'hi': 'hi-IN',
          'bn': 'bn-IN',
          'te': 'te-IN',
          'ta': 'ta-IN',
          'mr': 'mr-IN',
          'gu': 'gu-IN',
          'kn': 'kn-IN',
          'ml': 'ml-IN'
        };
        
        utterance.lang = languageMap[language] || 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const startRecording = async (fieldId: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    setIsRecording(true);
    setActiveFieldId(fieldId);

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Map language codes to BCP-47 format
      const languageMap: Record<string, string> = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN'
      };
      
      recognition.lang = languageMap[language] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({
          ...prev,
          [fieldId]: transcript
        }));
        setIsRecording(false);
        setActiveFieldId(null);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setActiveFieldId(null);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setActiveFieldId(null);
      };

      recognition.start();
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      setActiveFieldId(null);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

const fillForm = async () => {
  if (!formId) return;
  
  setIsProcessing(true);
  try {
    const response = await fetch('/api/forms/fill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formId,
        formData,
        formFields,
        imageHeight 
      })
    });
    
    const data = await response.json();
    if (data.success) {
      setDownloadUrl(data.downloadUrl);
    } else {
      alert('Failed to fill form: ' + data.error);
    }
  } catch (error) {
    console.error('Form filling error:', error);
    alert('Failed to fill form'); 
  } finally {
    setIsProcessing(false);
  }
};


  const resetForm = () => {
    setFile(null);
    setFormId(null);
    setFormFields([]);
    setFormData({});
    setDownloadUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <LocalizedText text="AI-Powered Form Filling Assistant" />
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            <LocalizedText text="Upload a form, let AI detect fields, fill it in your regional language, and download the completed document" />
          </p>
        </div>

        {!formId ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div 
              className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                <LocalizedText text="Upload Form" />
              </h3>
              <p className="text-gray-600 mb-4">
                <LocalizedText text="Click to upload a PDF or image form" />
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 rounded-lg">PDF</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg">JPG</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg">PNG</span>
              </div>
            </div>

            {file && (
              <div className="mt-6">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-gray-700">{file.name}</span>
                  </div>
                  <button
                    onClick={uploadForm}
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <LocalizedText text="Processing with AI..." />
                    ) : (
                      <LocalizedText text="Analyze with AI" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                <LocalizedText text="AI-Detected Form Fields" />
              </h2>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <LocalizedText text="Upload New Form" />
              </button>
            </div>

            <div className="space-y-6">
              {formFields.map(field => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => speakFieldLabel(field.label)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Listen"
                      >
                        <Volume2 className="h-5 w-5" />
                      </button>
                      <span className="font-medium text-gray-900 ml-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    <button
                      onClick={() => startRecording(field.id)}
                      disabled={isRecording}
                      className={`p-2 rounded-full ${
                        activeFieldId === field.id && isRecording
                          ? 'bg-red-100 text-red-600 animate-pulse'
                          : 'text-gray-500 hover:text-blue-600'
                      } transition-colors`}
                      title="Speak"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>
                  <input
                    type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${field.label}...`}
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  download
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  <LocalizedText text="Download Filled Form" />
                </a>
              ) : (
                <button
                  onClick={fillForm}
                  disabled={isProcessing || formFields.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      <LocalizedText text="Processing..." />
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      <LocalizedText text="Complete Form" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormFilling;
