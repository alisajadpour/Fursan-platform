import React from 'react';
import type { DataFeed } from '../types';

interface OSINTControlPanelProps {
  feeds: DataFeed[];
  onFeedToggle: (id: string) => void;
}

export const OSINTControlPanel: React.FC<OSINTControlPanelProps> = ({ feeds, onFeedToggle }) => {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/10 rounded-lg p-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">ماژول استخراج OSINT</h2>
      <div className="space-y-4">
        {feeds.map((feed) => (
          <div key={feed.id}>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold text-gray-200">{feed.name}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={feed.enabled}
                  onChange={() => onFeedToggle(feed.id)}
                />
                <div className="block bg-gray-700 w-10 h-6 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    feed.enabled ? 'transform translate-x-full bg-cyan-400' : ''
                }`}></div>
              </div>
            </label>
            <p className="text-xs text-gray-400 mt-1 pr-2">{feed.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};