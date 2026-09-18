import React from 'react';
import { KBArticle } from '../../types';
import { X, CheckCircle2, ArrowLeft, Clock, BookOpen, Sparkles, HelpCircle } from 'lucide-react';

interface ArticleModalProps {
  article: KBArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: (article: KBArticle) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  isOpen,
  onClose,
  onResolved,
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  {article.category}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {article.readTimeMinutes} min read
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                {article.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close article"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-medium">
            💡 <span className="font-bold text-slate-800">Summary:</span> {article.summary}
          </div>

          <div className="whitespace-pre-line font-sans space-y-2">
            {article.content.split('\n\n').map((block, idx) => {
              if (block.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-sm sm:text-base font-extrabold text-slate-900 mt-4 mb-2">
                    {block.replace('### ', '')}
                  </h3>
                );
              }
              if (block.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-xs sm:text-sm font-bold text-slate-800 mt-3 mb-1">
                    {block.replace('#### ', '')}
                  </h4>
                );
              }
              if (block.startsWith('```')) {
                const code = block.replace(/```[a-z]*\n?/g, '').trim();
                return (
                  <pre key={idx} className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto my-2">
                    <code>{code}</code>
                  </pre>
                );
              }
              return (
                <p key={idx} className="text-slate-700 leading-relaxed">
                  {block}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tags:</span>
              {article.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Deflection Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Did this article solve your problem?</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>No, Continue Raising Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => onResolved(article)}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Yes, Problem Solved</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
