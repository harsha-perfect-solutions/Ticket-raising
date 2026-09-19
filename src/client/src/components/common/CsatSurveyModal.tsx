import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle, X, Sparkles } from 'lucide-react';
import api from '../../services/api';

interface CsatSurveyModalProps {
  ticketId: string;
  ticketNumber: string;
  existingRating?: number;
  existingFeedback?: string;
  isOpen: boolean;
  onClose: () => void;
  onFeedbackSubmitted?: () => void;
}

export const CsatSurveyModal: React.FC<CsatSurveyModalProps> = ({
  ticketId,
  ticketNumber,
  existingRating,
  existingFeedback,
  isOpen,
  onClose,
  onFeedbackSubmitted,
}) => {
  const [rating, setRating] = useState<number>(existingRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>(existingFeedback || '');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const quickTags = [
    '⚡ Fast Resolution',
    '💬 Excellent Communication',
    '🎯 Highly Knowledgeable',
    '❤️ Very Helpful',
    '🛠️ Needs Improvement',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setErrorMsg('Please select a star rating between 1 and 5.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const finalComment = selectedTag
        ? `${selectedTag} — ${feedbackText.trim()}`.trim()
        : feedbackText.trim();

      await api.post(`/tickets/${ticketId}/feedback`, {
        rating,
        feedbackText: finalComment,
      });

      setIsSuccess(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center animate-scaleUp">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Feedback Received!</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Thank you for rating your support experience for <span className="font-semibold text-indigo-600 dark:text-indigo-400">#{ticketNumber}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">How was your support?</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Rate your satisfaction for ticket <span className="font-mono font-medium text-slate-700 dark:text-slate-300">#{ticketNumber}</span>
              </p>
            </div>

            {/* Interactive 5-Star Rating */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (hoverRating || rating);
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-3xl focus:outline-none transition-transform hover:scale-125"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-9 w-9 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                            : 'fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {hoverRating === 1 || (!hoverRating && rating === 1) && 'Poor'}
                {hoverRating === 2 || (!hoverRating && rating === 2) && 'Fair'}
                {hoverRating === 3 || (!hoverRating && rating === 3) && 'Good'}
                {hoverRating === 4 || (!hoverRating && rating === 4) && 'Very Good'}
                {hoverRating === 5 || (!hoverRating && rating === 5) && 'Excellent!'}
              </p>
            </div>

            {/* Quick Sentiment Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Quick Tags (Optional)</label>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Feedback Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> Additional Comments
              </label>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what went well or how we can improve..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-red-50 p-2.5 text-center text-xs font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {errorMsg}
              </p>
            )}

            {/* Submit & Cancel Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Submit Rating</span>
                    <Sparkles className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
