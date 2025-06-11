import React, { useState } from 'react';
import { Upload, FileText, Download, Eye, Trash2, Languages, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: Date;
  status: 'analyzing' | 'completed' | 'error';
  analysis?: string;
}

interface DocumentUploadProps {
  selectedLanguage: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ selectedLanguage }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisView, setAnalysisView] = useState<string | null>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'as', name: 'অসমীয়া' },
    { code: 'sa', name: 'संस्कृतम्' },
    { code: 'ks', name: 'कॉशुर' },
    { code: 'ne', name: 'नेपाली' },
    { code: 'sd', name: 'सिन्धी' },
    { code: 'doi', name: 'डोगरी' },
    { code: 'mni', name: 'ꯃꯤꯇꯩꯂꯣꯟ' },
    { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ' },
    { code: 'ur', name: 'اُردُو' },
    { code: 'brx', name: 'बड़ो' },
    { code: 'kok', name: 'कोंकणी' },
    { code: 'lus', name: 'Mizo ṭawng' }
  ];

  const sampleAnalysis = `This document is a rental agreement containing the following key points:

**Key Terms:**
• Monthly Rent: ₹25,000
• Security Deposit: ₹50,000  
• Rental Period: 11 months
• Rent Increase: 10% annually

**Legal Advice:**
1. This agreement is valid under the Indian Rent Control Act.
2. All essential clauses are present.
3. Security deposit is within reasonable limits.

**Next Steps:**
• Both parties must sign.
• Get notarized.
• Print on stamp paper.`;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    files.forEach((file) => {
      const newDoc: Document = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        uploadDate: new Date(),
        status: 'analyzing'
      };

      setDocuments(prev => [...prev, newDoc]);

      // Simulate analysis
      setTimeout(() => {
        setDocuments(prev => prev.map(doc => 
          doc.id === newDoc.id 
            ? { ...doc, status: 'completed', analysis: sampleAnalysis }
            : doc
        ));
      }, 3000);
    });
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'analyzing': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'analyzing': return 'Analyzing...';
      case 'completed': return 'Analysis Complete';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Document Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your legal documents and get AI-powered analysis. We process your documents securely.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Language</h3>
                <Languages className="w-5 h-5 text-gray-500" />
              </div>
              <select
                value={selectedLanguage}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-100 cursor-not-allowed"
                title="Change language from the top bar"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`bg-white rounded-xl shadow-lg p-8 border-2 border-dashed transition-colors ${
                dragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Document
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your file here or click to select
                </p>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <label
                  htmlFor="fileInput"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors cursor-pointer"
                >
                  Choose File
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                </p>
              </div>
            </motion.div>
          </div>
          {/* Documents List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Uploaded Documents ({documents.length})
                </h3>
              </div>
              
              <div className="p-6">
                <AnimatePresence>
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <FileText className="w-8 h-8 text-primary-600" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {doc.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {doc.size} • {doc.uploadDate.toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                {getStatusText(doc.status)}
                              </span>
                              
                              {doc.status === 'completed' && (
                                <button
                                  onClick={() => setAnalysisView(doc.id)}
                                  className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                                  title="View Analysis"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => deleteDocument(doc.id)}
                                className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {doc.status === 'analyzing' && (
                            <div className="mt-3">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                              </div>
                            </div>
                          )}
                          
                          {doc.status === 'completed' && (
                            <div className="mt-3 flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm">Analysis ready</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Modal */}
        <AnimatePresence>
          {analysisView && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Document Analysis</h3>
                  <button
                    onClick={() => setAnalysisView(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {sampleAnalysis}
                    </pre>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setAnalysisView(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DocumentUpload;
