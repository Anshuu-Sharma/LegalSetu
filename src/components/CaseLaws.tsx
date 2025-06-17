import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Highlighter from 'react-highlight-words';
import { Search, Sparkles, FileText, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext'; 
import LocalizedText from './LocalizedText';

// Language options
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
  { code: 'ne', name: 'नेपाली' },
  { code: 'ur', name: 'اُردُو' }
];



interface ConstitutionArticle {
  article: string | number;
  title: string;
  description: string;
}

const CaseLaws: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const [articles, setArticles] = useState<ConstitutionArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ConstitutionArticle[]>([]);
  const [loading, setLoading] = useState(true);
  // const [language, setLanguage] = useState('en');
  const [expandedArticle, setExpandedArticle] = useState<string | number | null>(null);

  useEffect(() => {
    fetch('/constitution_of_india.json')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || data);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setExpandedArticle(null);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    const match = value.match(/article\s*(\d+[A-Z]?)/i) || value.match(/^(\d+[A-Z]?)$/i);
    if (match) {
      setResults(articles.filter(a => String(a.article) === match[1]));
      return;
    }
    setResults(
      articles.filter(a =>
        (a.title && a.title.toLowerCase().includes(value.toLowerCase())) ||
        (a.description && a.description.toLowerCase().includes(value.toLowerCase()))
      )
    );
  };

  const handleExpand = (articleId: string | number) => {
    setExpandedArticle(prev => (prev === articleId ? null : articleId));
  };

  const showArticles = (searchTerm.trim() && results.length > 0) || expandedArticle !== null;
  const showNoResults = searchTerm.trim() && results.length === 0 && expandedArticle === null;

  const expandedCard = expandedArticle !== null
    ? results.find(a => String(a.article) === String(expandedArticle))
      || articles.find(a => String(a.article) === String(expandedArticle))
    : null;

  const searchWords = searchTerm
    .replace(/article\s*\d+[A-Z]?/gi, '')
    .split(/\s+/)
    .filter(Boolean);

    const [translatedExpandedTitle, setTranslatedExpandedTitle] = React.useState(expandedCard?.title || '');
const [translatedExpandedDescription, setTranslatedExpandedDescription] = React.useState(expandedCard?.description || '');

React.useEffect(() => {
  let isMounted = true;
  if (expandedCard) {
    t(expandedCard.title).then(result => {
      if (isMounted) setTranslatedExpandedTitle(result);
    });
    t(expandedCard.description).then(result => {
      if (isMounted) setTranslatedExpandedDescription(result);
    });
  }
  return () => { isMounted = false; };
}, [expandedCard, t, language]);

const [translatedTitles, setTranslatedTitles] = useState<{[key: string]: string}>({});

useEffect(() => {
    let isMounted = true;
    const translateAll = async () => {
      const translations: {[key: string]: string} = {};
      await Promise.all(results.map(async (article) => {
        translations[article.article] = await t(article.title);
      }));
      if (isMounted) setTranslatedTitles(translations);
    };
    translateAll();
    return () => { isMounted = false; };
  }, [results, t, language]);
  
    
  return (
    <div className="mt-16">
      {/* Header Container */}
      <div className="max-w-2xl mx-auto p-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <FileText className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <LocalizedText text='Constitutional Article Search' />
              </h2>
              <p className="text-sm text-green-600 flex items-center font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                <LocalizedText text='Search and explore Indian law instantly.'/>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Languages className="w-5 h-5 text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar OUTSIDE the container */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by keyword or article number (e.g., 'article 14', 'equality')"
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow text-base"
          />
          <Search className="absolute right-4 top-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Results */}
      <div className="w-full flex justify-center mb-8">
        <style>
          {`
            @media (max-width: 920px) {
              .custom-article-grid {
                grid-template-columns: 1fr !important;
              }
            }
            .search-highlight {
              background-color: #fff59d;
              color: #222;
              font-weight: bold;
              border-radius: 3px;
              padding: 0 2px;
            }
          `}
        </style>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"
            />
          </div>
        ) : showNoResults ? (
          <div className="w-full max-w-xl flex flex-col items-center bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow text-center">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
              <span className="font-semibold text-blue-700 text-lg"><LocalizedText text='No articles found for your query.'/></span>
            </div>
            <div className="text-gray-600"><LocalizedText text='Try a different keyword or article number.'/></div>
          </div>
        ) : showArticles ? (
          expandedCard ? (
            <div className="w-full max-w-2xl mx-auto">
              <div
                className="w-full bg-white border border-gray-100 rounded-xl p-6 shadow-xl flex flex-col text-base cursor-pointer transition hover:shadow-2xl"
                onClick={() => setExpandedArticle(null)}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-blue-700">
                    <LocalizedText text={`Article ${expandedCard.article}:${" "}`}/>
                    <Highlighter
                      highlightClassName="search-highlight"
                      searchWords={searchWords} 
                      autoEscape={true}
                      textToHighlight={translatedExpandedTitle}
                    />
                  </h2>
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                </div>
                <div className="mt-6 text-gray-700">
                  <Highlighter
                    highlightClassName="search-highlight"
                    searchWords={searchWords}
                    autoEscape={true}
                    textToHighlight={translatedExpandedDescription}
                  />
                </div>
                <div className="mt-6 text-right">
                  <span className="text-blue-500 text-sm italic">(Click anywhere to go back)</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="custom-article-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center items-start"
              style={{ width: '100%', maxWidth: '1400px' }}
            >
              {results.map(article => 
                
               (
                <div
                  key={article.article}
                  className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow flex flex-col text-sm cursor-pointer transition hover:shadow-xl"
                  onClick={() => handleExpand(article.article)}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-blue-700">
                      <LocalizedText text={`Article ${article.article}:${" "}`}/>
                      <Highlighter
                        highlightClassName="search-highlight"
                        searchWords={searchWords}
                        autoEscape={true}
                        textToHighlight={translatedTitles[article.article] || article.title}
                      />
                    </h2>
                    <span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default CaseLaws;
