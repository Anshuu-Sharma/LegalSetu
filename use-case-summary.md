# LegalSetu - Use Case Diagram Summary

## Project Overview
LegalSetu is an AI-powered multilingual legal assistant platform designed specifically for the Indian legal system. It provides comprehensive legal services through multiple interfaces and supports 10+ Indian languages.

## Primary Actors

### 1. **User/Client** 👤
- General users seeking legal assistance
- Can access AI chat, document analysis, form filling, and advocate services
- Primary beneficiary of the platform

### 2. **Advocate** 👩‍⚖️
- Registered legal professionals
- Provide real-time consultation services
- Manage their profiles and availability

### 3. **AI System** 🤖
- Gemini AI for legal advice and document analysis
- Google APIs for translation, maps, and speech services
- Automated processing and recommendations

### 4. **Admin** 👨‍💼
- Platform administrators
- Manage advocates, monitor system, handle approvals
- Maintain platform integrity

### 5. **External APIs** 🌐
- Google Translate, Maps, TTS/STT
- Firebase Authentication
- AWS S3 Storage
- Socket.IO for real-time communication

## Core Feature Categories

### 🤖 AI Legal Assistant (Neeti)
**Primary Use Cases:**
- Ask Legal Questions
- Get AI Legal Advice
- Voice Input/Output
- Multilingual Support
- Constitution Search

**Key Features:**
- 24/7 availability
- Multi-language support (10+ Indian languages)
- Voice interaction capabilities
- Chat history management
- Legal recommendations

### 📄 Document Analysis
**Primary Use Cases:**
- Upload Documents
- AI Document Analysis
- Chat with Document
- Download Analysis

**Key Features:**
- Support for PDF, DOCX, images
- Extract key clauses and risks
- Provide legal suggestions
- Interactive document chat
- Multilingual analysis

### 👩‍⚖️ Advocate Services (AdvoTalk)
**Primary Use Cases:**
- Find Nearby Advocates
- Live Chat with Advocates
- Start Consultation
- Real-time Messaging

**Key Features:**
- Location-based advocate discovery
- Real-time chat with verified advocates
- Profile viewing and reviews
- Consultation fee management
- Chat history preservation

### 📝 Form Assistant
**Primary Use Cases:**
- Upload Forms
- AI Field Detection
- Voice Form Filling
- Generate Filled Forms

**Key Features:**
- AI-powered field detection
- Voice-guided form filling
- Multilingual form support
- PDF generation and download

### 🔐 Authentication & Profile
**Primary Use Cases:**
- User Registration/Login
- Google OAuth
- Profile Management
- Language Preferences

**Key Features:**
- Firebase authentication
- Social login options
- Personalized settings
- Secure session management

### 👨‍💼 Admin Functions
**Primary Use Cases:**
- Manage Advocates
- Approve Registrations
- Update Consultation Fees
- Monitor System Statistics

**Key Features:**
- Advocate approval workflow
- Real-time system monitoring
- Bulk operations
- Fee management

## System Architecture Highlights

### Real-time Features
- Socket.IO for live chat
- Real-time notifications
- Online status tracking
- Typing indicators

### Multilingual Support
- 10+ Indian languages
- Voice input/output in regional languages
- Real-time translation
- Localized UI

### AI Integration
- Gemini AI for legal analysis
- Google Cloud services
- OCR for document processing
- Natural language processing

### Security & Storage
- Firebase authentication
- AWS S3 for file storage
- Secure API endpoints
- Data encryption

## Key Relationships

### Extends Relationships
- "Chat with Document" extends "Upload Documents"
- "Voice Form Filling" extends "Upload Forms"
- "Real-time Messaging" extends "Start Consultation"

### Includes Relationships
- "Get AI Legal Advice" includes "Multilingual Support"
- "AI Document Analysis" includes "Extract Key Clauses"
- "Find Nearby Advocates" includes "Google Maps API"

### Generalization
- "User" generalizes to "Client" and "Advocate"
- "Authentication" generalizes to different login types

## Technology Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MySQL with connection pooling
- **AI/ML:** Google Gemini, Google Cloud APIs
- **Storage:** AWS S3
- **Authentication:** Firebase Auth
- **Real-time:** Socket.IO
- **Deployment:** Production-ready with health checks

## Unique Value Propositions
1. **India-specific:** Designed for Indian legal system
2. **Multilingual:** Native support for 10+ Indian languages
3. **AI-powered:** Advanced document analysis and legal advice
4. **Real-time:** Live chat with verified advocates
5. **Comprehensive:** End-to-end legal assistance platform
6. **Accessible:** Voice support for all features
7. **Secure:** Enterprise-grade security and data protection

This use case diagram represents a comprehensive legal technology platform that bridges the gap between AI automation and human expertise, making legal services accessible to all Indians regardless of language or location.