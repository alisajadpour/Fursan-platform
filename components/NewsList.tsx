
import React from 'react';
import type { NewsArticle } from '../types';
import { NewsItemCard } from './NewsItemCard';

interface NewsListProps {
  newsItems: NewsArticle[];
  selectedNewsItem: NewsArticle | null;
  onSelectNews: (article: NewsArticle) => void;
  isApiBusy: boolean;
}

export const NewsList: React.FC<NewsListProps> = ({ newsItems, selectedNewsItem, onSelectNews, isApiBusy }) => {
  if (newsItems.length === 0) {
    return <p className="text-gray-400 p-4 text-center">موردی برای نمایش وجود ندارد.</p>;
  }

  return (
    <div className="space-y-2">
      {newsItems.map((item) => (
        <NewsItemCard 
          key={item.id} 
          article={item} 
          isSelected={selectedNewsItem?.id === item.id}
          onSelect={() => onSelectNews(item)}
          isApiBusy={isApiBusy}
        />
      ))}
    </div>
  );
};
