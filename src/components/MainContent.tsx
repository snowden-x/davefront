import React, { useState, useEffect } from 'react';
import { ChatInterface } from './ChatInterface';
import { UsersPage } from '@/pages/UsersPage';
import { LibraryPage } from '@/pages/LibraryPage';

type PageType = 'chat' | 'users' | 'library';

export function MainContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('chat');

  // Function to change pages - will be called from navigation
  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
  };

  // Expose navigation function globally so NavUser can call it
  useEffect(() => {
    (window as any).navigateTo = navigateTo;
    
    // Cleanup function to remove global function when component unmounts
    return () => {
      delete (window as any).navigateTo;
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatInterface />;
      case 'users':
        return <UsersPage />;
      case 'library':
        return <LibraryPage />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {renderPage()}
    </div>
  );
}
