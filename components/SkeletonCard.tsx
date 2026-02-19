
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 animate-pulse">
      <div className="h-4 w-1/4 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
      <div className="h-6 w-3/4 bg-gray-300 dark:bg-slate-600 rounded mb-2"></div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-slate-800">
        <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
