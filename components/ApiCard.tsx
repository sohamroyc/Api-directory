
import React from 'react';
import { PublicApi, User } from '../types';
import { ExternalLink, Lock, Unlock, Zap, ShieldCheck, Heart } from 'lucide-react';

interface ApiCardProps {
  api: PublicApi;
  currentUser: User | null;
  onToggleFavorite: (apiId: string) => void;
  isFavorited: boolean;
}

const ApiCard: React.FC<ApiCardProps> = ({ api, currentUser, onToggleFavorite, isFavorited }) => {
  const colors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
    'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500'
  ];
  const colorIndex = api.name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className="group relative bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500 flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-500`}>
          {api.name.charAt(0)}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => { e.preventDefault(); onToggleFavorite(api.id); }}
              className={`p-2.5 rounded-xl transition-all ${
                isFavorited 
                  ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' 
                  : 'bg-gray-50 text-gray-400 dark:bg-slate-800 hover:text-rose-500'
              }`}
            >
              <Heart size={18} fill={isFavorited ? "currentColor" : "none"} className={isFavorited ? "scale-110" : ""} />
            </button>
             <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-transparent group-hover:border-gray-200 dark:group-hover:border-slate-700 transition-colors">
              {api.category}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
            {api.name}
          </h3>
          <ShieldCheck size={16} className="text-emerald-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {api.description}
        </p>

        {api.ai_summary && (
          <div className="mt-4 p-4 bg-brand-50/30 dark:bg-brand-900/10 border-l-2 border-brand-500 rounded-r-2xl">
            <div className="flex items-center text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase mb-2">
              <Zap size={10} className="mr-1.5" />
              Developer Insight
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed italic">
              "{api.ai_summary}"
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center">
          {api.auth_required ? (
            <div className="flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
              <Lock size={12} className="mr-1.5" />
              API Key
            </div>
          ) : (
            <div className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              <Unlock size={12} className="mr-1.5" />
              Free Access
            </div>
          )}
        </div>
        
        <a 
          href={api.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-bold hover:bg-brand-600 dark:hover:bg-brand-500 hover:text-white transition-all transform active:scale-95"
        >
          View Docs
          <ExternalLink size={12} className="ml-2" />
        </a>
      </div>
    </div>
  );
};

export default ApiCard;
