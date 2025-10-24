import React, { useState, useEffect } from 'react';
import type { NewsArticle } from '../types';

interface NewsItemCardProps {
  article: NewsArticle;
  isSelected: boolean;
  onSelect: () => void;
  isApiBusy: boolean;
}

const getTopicColor = (topic: string) => {
    switch (topic.toLowerCase()) {
        case 'فناوری': return 'border-r-blue-400';
        case 'سیاست': return 'border-r-red-400';
        case 'علم': return 'border-r-green-400';
        case 'رویدادهای جهانی': return 'border-r-yellow-400';
        default: return 'border-r-purple-400';
    }
}

const getCredibilityClasses = (score: number) => {
    if (score > 75) return 'text-green-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-red-400';
}

const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " سال پیش";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ماه پیش";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " روز پیش";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ساعت پیش";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " دقیقه پیش";
    return "همین الان";
}


export const NewsItemCard: React.FC<NewsItemCardProps> = ({ article, isSelected, onSelect, isApiBusy }) => {
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);

  useEffect(() => {
    const storedFeedback = localStorage.getItem(`fursan_feedback_news_${article.id}`);
    if (storedFeedback === 'good' || storedFeedback === 'bad') {
      setFeedback(storedFeedback);
    } else {
      setFeedback(null);
    }
  }, [article.id]);

  const handleFeedback = (rating: 'good' | 'bad') => {
    localStorage.setItem(`fursan_feedback_news_${article.id}`, rating);
    setFeedback(rating);
  };
  
  const isDisabled = isApiBusy && !isSelected;

  const baseClasses = "w-full p-3 rounded-md transition-all duration-200 ease-in-out border-r-4 flex flex-col justify-between";
  const selectedClasses = "bg-cyan-900/60 ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20";
  const unselectedClasses = "bg-gray-800/70 hover:bg-gray-700/90";
  const topicColorClass = getTopicColor(article.topic);
  const credibilityColorClass = getCredibilityClasses(article.credibility_score);
  const disabledClasses = isDisabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer';

  return (
    <div
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses} ${topicColorClass} ${disabledClasses}`}
      role="button"
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => !isDisabled && (e.key === 'Enter' || e.key === ' ') && onSelect()}
      onClick={!isDisabled ? onSelect : undefined}
    >
      <div>
        <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-sm text-gray-100 flex-1">{article.headline}</h3>
            <span className="text-xs text-gray-500 flex-shrink-0 mr-2">{formatTimeAgo(article.timestamp)}</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">{article.summary}</p>
      </div>

      <div className="flex justify-between items-center text-gray-400 mt-2">
         {/* Left side: Source and Credibility */}
        <div className="text-xs flex flex-col items-start">
             <span className="font-mono text-gray-500">{article.source_name}</span>
             <div className="flex items-center gap-1">
                <span className={`font-bold font-mono ${credibilityColorClass}`}>{article.credibility_score}</span>
                <span className="text-gray-500">اعتبار</span>
             </div>
        </div>

         {/* Right side: Feedback */}
        <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleFeedback('good'); }}
              disabled={!!feedback}
              className={`p-1 rounded-full transition-colors disabled:opacity-60 ${feedback === 'good' ? 'text-green-400' : 'hover:bg-gray-700'}`}
              aria-label="خلاصه خوب بود"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.942-.671l2.716-6.452A1 1 0 0016 9.5H12.5a1.5 1.5 0 01-1.5-1.5V3.333a1 1 0 00-1-1 1 1 0 00-1 1v1.167a2.5 2.5 0 01-2.5 2.5H6z" /></svg>
            </button>
             <button
              onClick={(e) => { e.stopPropagation(); handleFeedback('bad'); }}
              disabled={!!feedback}
              className={`p-1 rounded-full transition-colors disabled:opacity-60 ${feedback === 'bad' ? 'text-red-400' : 'hover:bg-gray-700'}`}
              aria-label="خلاصه بد بود"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.364a1 1 0 00-.942.671L2.978 9.119A1 1 0 004 10.5H7.5a1.5 1.5 0 011.5 1.5v5.167a1 1 0 001 1 1 1 0 001-1v-1.167a2.5 2.5 0 012.5-2.5H14z" /></svg>
            </button>
          </div>
      </div>
    </div>
  );
};
