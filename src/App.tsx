// import React, { useState } from 'react';
// import Header from './components/Header';
// import Hero from './components/Hero';
// import Features from './components/Features';
// import ChatInterface from './components/ChatInterface';
// import DocumentUpload from './components/DocumentUpload';
// import Footer from './components/Footer';
// import { TranslationProvider } from './contexts/TranslationContext';

// function App() {
//   const [activeSection, setActiveSection] = useState('home');

//   return (
//     <TranslationProvider>
//       <div className="min-h-screen bg-gray-50">
//         <Header 
//           activeSection={activeSection} 
//           setActiveSection={setActiveSection}
//         />

//         {activeSection === 'home' && (
//           <>
//             <Hero setActiveSection={setActiveSection} />
//             <Features />
//           </>
//         )}

//         {activeSection === 'chat' && <ChatInterface />}
//         {activeSection === 'documents' && <DocumentUpload />}
        
//         <Footer />
//       </div>
//     </TranslationProvider>
//   );
// }

// export default App;

import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import ChatInterface from './components/ChatInterface';
import DocumentUpload from './components/DocumentUpload';
import Footer from './components/Footer';
import { TranslationProvider } from './contexts/TranslationContext';

function App() {
  const [activeSection, setActiveSection] = useState('home');

  return (
    <TranslationProvider>
      <div className="min-h-screen bg-gray-50">
        <Header activeSection={activeSection} setActiveSection={setActiveSection} />

        {/* Prevents content from being hidden behind header */}
        <main className="pt-20">
          {activeSection === 'home' && (
            <>
              <Hero setActiveSection={setActiveSection} />
              <Features />
            </>
          )}

          {activeSection === 'chat' && <ChatInterface />}
          {activeSection === 'documents' && <DocumentUpload />}
        </main>

        <Footer />
      </div>
    </TranslationProvider>
  );
}

export default App;

