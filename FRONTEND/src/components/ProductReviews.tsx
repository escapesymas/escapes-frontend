'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Loader2 } from 'lucide-react';

interface Review {
  id: number;
  product_id: number;
  user_id: number | null;
  rating: number;
  title: string | null;
  content: string | null;
  verified_purchase: boolean;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: { [key: number]: number };
}

interface ProductReviewsProps {
  productId: number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId, ...newReview })
      });

      if (res.ok) {
        setShowForm(false);
        setNewReview({ rating: 5, title: '', content: '' });
        fetchReviews();
      } else {
        const data = await res.json();
        setError(data.error || 'Error submitting review');
      }
    } catch (e) {
      setError('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && stats.total > 0 && (
        <div className="bg-card rounded-lg p-4 border border-card-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold">{stats.average.toFixed(1)}</div>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= Math.round(stats.average) ? 'fill-accent text-accent' : 'text-muted'}
                  />
                ))}
              </div>
              <p className="text-sm text-muted mt-1">{stats.total} opiniones</p>
            </div>
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{rating}</span>
                  <Star size={12} className="text-accent fill-accent" />
                  <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-muted w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviews.length === 0 && !loading && (
        <div className="text-center py-8 text-muted">
          <p>Este producto aún no tiene opiniones</p>
          <p className="text-sm mt-1">¡Sé el primero en valorarlo!</p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-card rounded-lg p-4 border border-card-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-accent">
                    {review.username?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{review.username || 'Anónimo'}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= review.rating ? 'fill-accent text-accent' : 'text-muted'}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted">
                {new Date(review.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>

            {review.title && (
              <p className="font-medium mt-3">{review.title}</p>
            )}
            {review.content && (
              <p className="text-sm mt-1 text-muted">{review.content}</p>
            )}

            {review.verified_purchase && (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <ThumbsUp size={12} />
                <span>Compra verificada</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 px-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          Escribir una opinión
        </button>
      )}

      {showForm && (
        <form onSubmit={submitReview} className="bg-card rounded-lg p-4 border border-card-border space-y-4">
          <h4 className="font-medium">Tu opinión</h4>

          <div>
            <label className="block text-sm mb-1">Valoración</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="p-1"
                >
                  <Star
                    size={24}
                    className={star <= newReview.rating ? 'fill-accent text-accent' : 'text-muted'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Título (opcional)</label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-card-border bg-background text-foreground"
              placeholder="Resume tu experiencia"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Tu opinión (opcional)</label>
            <textarea
              value={newReview.content}
              onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
              className="w-full px-3 py-2 rounded border border-card-border bg-background text-foreground"
              placeholder="Cuéntanos tu experiencia con el producto"
              rows={4}
              maxLength={2000}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 px-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="py-2 px-4 border border-card-border rounded-lg hover:bg-card-border transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}