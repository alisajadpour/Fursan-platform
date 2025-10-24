import React from 'react';

interface HeaderProps {
  onRefresh: () => void;
  onGenerateBriefing: () => void;
  isBusy: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, onGenerateBriefing, isBusy }) => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm shadow-lg p-4 flex justify-between items-center sticky top-0 z-10 border-b border-cyan-500/20">
      <div className="flex items-center space-x-4">
         <div className="w-10 h-10 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="fursan-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>
                <path d="M4 3h16v4H8v4h10v4H8v6H4V3z" fill="url(#fursan-logo-gradient)" />
              </svg>
         </div>
        <h1 className="text-2xl font-bold text-white tracking-wider">فرسان</h1>
        <span className="text-sm text-cyan-400 font-mono hidden md:inline">سامانه هوشمند اطلاعات</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onGenerateBriefing}
          disabled={isBusy}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 shadow-md hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-blue-600"
          aria-label="دریافت گزارش روزانه"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">گزارش روزانه</span>
        </button>
        <button
          onClick={onRefresh}
          disabled={isBusy}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 shadow-md hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-cyan-600"
          aria-label="بارگذاری مجدد جریان اخبار"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">بارگذاری مجدد</span>
        </button>
      </div>
    </header>
  );
};