import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext.tsx';
import LanguageSelector from './Document/LanguageSelector';
import FileUploader from './Document/FileUploader.tsx';
import DocumentList from './Document/DocumentList.tsx';
import AnalysisModal from './Document/AnalysisModal.tsx';

interface AnalysisResult {
  summary: string;
  clauses: string[];
  risks: string[];
  suggestions: string[];
  fullText: string;
  _meta?: {
    pages: number;
    pageMetadata: Record<string, any>;
  };
}

interface UploadedDocument {
  id: string;
  analysisId?: string;  // Changed from docId to analysisId
  name: string;
  type: string;
  size: string;
  uploadDate: Date;
  status: 'analyzing' | 'completed' | 'error';
  analysis?: AnalysisResult;
}

const DocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisView, setAnalysisView] = useState<string | null>(null);

  const { language, t } = useTranslation();
  const [localizedText, setLocalizedText] = useState({
    headerTitle: 'Document Analysis',
    headerSubtitle: 'Upload documents and get AI-powered insights.',
    uploadLabel: 'Upload Document',
    chooseFileLabel: 'Choose File',
    fileTypesLabel: 'PDF, DOC, JPG, PNG (Max 10MB)',
    uploadedDocsLabel: 'Uploaded Documents',
    noDocsLabel: 'No documents uploaded'
  });

  useEffect(() => {
    const translateUI = async () => {
      try {
        const translations = await Promise.all([
          t('Document Analysis'),
          t('Upload documents and get AI-powered insights.'),
          t('Upload Document'),
          t('Choose File'),
          t('PDF, DOC, JPG, PNG (Max 10MB)'),
          t('Uploaded Documents'),
          t('No documents uploaded')
        ]);
        setLocalizedText({
          headerTitle: translations[0],
          headerSubtitle: translations[1],
          uploadLabel: translations[2],
          chooseFileLabel: translations[3],
          fileTypesLabel: translations[4],
          uploadedDocsLabel: translations[5],
          noDocsLabel: translations[6]
        });
      } catch (error) {
        console.error('Translation error:', error);
      }
    };
    translateUI();
  }, [language, t]);

  const handleFiles = async (files: File[]) => {
    try {
      for (const file of files) {
        const id = Date.now().toString() + Math.random();
        const newDoc: UploadedDocument = {
          id,
          name: file.name,
          type: file.type,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          uploadDate: new Date(),
          status: 'analyzing'
        };

        setDocuments(prev => [...prev, newDoc]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', language);

        const response = await fetch('http://localhost:4000/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Analysis request failed');

        const result = await response.json();
        
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === id
              ? {
                  ...doc,
                  analysisId: result.analysisId, // Store backend analysisId
                  status: 'completed',
                  analysis: result.analysis ? {
                    summary: result.analysis.summary || '',
                    clauses: result.analysis.clauses || [],
                    risks: result.analysis.risks || [],
                    suggestions: result.analysis.suggestions || [],
                    fullText: result.analysis.fullText || '',
                    _meta: result.analysis._meta || { pages: 0, pageMetadata: {} }
                  } : undefined
                }
              : doc
          )
        );
      }
    } catch (error) {
      console.error('File processing error:', error);
      setDocuments(prev =>
        prev.map(doc =>
          doc.status === 'analyzing'
            ? { ...doc, status: 'error', analysis: undefined }
            : doc
        )
      );
    }
  };

  // Fetch analysis by analysisId when viewing
  const fetchAnalysisById = async (analysisId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/analysis/${analysisId}?lang=${language}`);
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const data = await response.json();

      setDocuments(prev =>
        prev.map(doc =>
          doc.analysisId === analysisId
            ? { ...doc, analysis: data, status: 'completed' }
            : doc
        )
      );
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  // When user selects a document to view analysis
  useEffect(() => {
    if (analysisView) {
      fetchAnalysisById(analysisView);
    }
  }, [analysisView, language]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold">{localizedText.headerTitle}</h2>
        <p className="text-gray-600">{localizedText.headerSubtitle}</p>
      </motion.div>

      {/* File Uploader */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <FileUploader
          onFiles={handleFiles}
          dragActive={dragActive}
          setDragActive={setDragActive}
          uploadLabel={localizedText.uploadLabel}
          chooseFileLabel={localizedText.chooseFileLabel}
          fileTypesLabel={localizedText.fileTypesLabel}
        />
      </motion.div>

      {/* Document List */}
      <DocumentList
        documents={documents}
        onDelete={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
        onViewAnalysis={(analysisId) => setAnalysisView(analysisId)}
        uploadedDocsLabel={localizedText.uploadedDocsLabel}
        noDocsLabel={localizedText.noDocsLabel}
      />

      {/* Analysis Modal */}
      {analysisView && (
        <AnalysisModal
          analysis={documents.find(d => d.analysisId === analysisView)?.analysis}
          onClose={() => setAnalysisView(null)}
        />
      )}
    </div>
  );
};

export default DocumentUpload;
