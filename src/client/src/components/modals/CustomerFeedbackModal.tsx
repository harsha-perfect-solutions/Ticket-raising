import React, { useState } from 'react';
import { ticketApi } from '../../services/api';
import { Star, X, MessageSquareHeart } from 'lucide-react';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketNumber: string;
  onClose: () => void;
  onFeedbackSubmitted: () => void;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  ticketId,
  ticketNumber,
  onClose,
  onFeedbackSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await ticketApi.submitFeedback(ticketId, {
        rating,
        feedbackText: feedbackText.trim() || undefined,
      });
      if (res.data.success) {
        onFeedbackSubmitted();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setIsLoading(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: '1/5 - Very Dissatisfied (Issue unresolved or poor response)',
    2: '2/5 - Dissatisfied (Delayed or difficult resolution)',
    3: '3/5 - Neutral (Acceptable service)',
    4: '4/5 - Satisfied (Quick and effective help)',
    5: '5/5 - Excellent! (Exceeded expectations)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Rate Your Support Experience</h3>
              <p className="text-xs text-slate-500">Feedback for Ticket {ticketNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="text-center space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              How would you rate our resolution?
            </label>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (hoveredRating !== null ? star <= hoveredRating : star <= rating)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-amber-700">
              {ratingDescriptions[hoveredRating || rating]}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Additional Comments / Suggestions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Tell us what you liked or how we can improve..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all"
            >
              {isLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
