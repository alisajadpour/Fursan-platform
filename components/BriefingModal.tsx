import React from 'react';
import { Spinner } from './Spinner';

interface BriefingModalProps {
  isOpen: boolean;
  isLoading: boolean;
  content: string;
  onClose: () => void;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({ isOpen, isLoading, content, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cyan-400">گزارش اطلاعاتی روزانه</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <Spinner />
              <p className="mt-4 text-cyan-400">در حال تهیه گزارش...</p>
            </div>
          ) : (
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          )}
        </div>
        <footer className="p-4 border-t border-gray-700 text-right">
            <button
                onClick={onClose}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                بستن
            </button>
        </footer>
      </div>
    </div>
  );
};