import React from 'react';
import type { WorkflowState, WorkflowStatus } from '../types';
import { Spinner } from './Spinner';

interface WorkflowStatusPanelProps {
  workflowState: WorkflowState;
}

const statusConfig: Record<WorkflowStatus, { color: string; text: string; icon: React.ReactNode }> = {
  pending: {
    color: 'text-gray-400',
    text: 'در حال انتظار',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  running: {
    color: 'text-cyan-400',
    text: 'در حال اجرا',
    icon: <Spinner />,
  },
  success: {
    color: 'text-green-400',
    text: 'موفق',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  failed: {
    color: 'text-red-400',
    text: 'ناموفق',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
};

export const WorkflowStatusPanel: React.FC<WorkflowStatusPanelProps> = ({ workflowState }) => {
  const modules = Object.values(workflowState);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/10 rounded-lg p-4 animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">وضعیت سیستم و گردش کار</h2>
      <ul className="space-y-3">
        {modules.map((module) => {
          const config = statusConfig[module.status];
          return (
            <li key={module.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{module.name}</span>
              <div className={`flex items-center space-x-2 space-x-reverse font-mono ${config.color}`}>
                <span>{config.text}</span>
                <span className="w-5 h-5 flex items-center justify-center">
                    {config.icon}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
