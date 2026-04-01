import { FiStar } from 'react-icons/fi';
import Image from 'next/image';

export default function ReviewCard({ review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="bg-amber-900/10 border border-amber-900/30 rounded-2xl p-6 shadow-md hover:shadow-amber-900/10 transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full bg-amber-800/50 border border-amber-700/50 overflow-hidden flex items-center justify-center text-amber-400 font-playfair font-bold text-xl">
            {review.user?.image ? (
              <Image src={review.user.image} alt={review.user.name} fill className="object-cover" />
            ) : (
              <span>{review.user?.name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div>
            <h5 className="font-playfair font-bold text-amber-50">{review.user?.name || 'Anonymous User'}</h5>
            <div className="text-xs text-amber-100/50 flex space-x-1 items-center">
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              {review.isVerifiedPurchase && (
                <>
                   <span className="mx-1">•</span>
                   <span className="text-amber-500/80">Verified Purchase</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1">
          {stars.map((star) => (
            <FiStar
              key={star}
              className={`w-4 h-4 ${
                star <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-amber-900/50'
              }`}
            />
          ))}
        </div>
      </div>
      
      <p className="text-amber-100/70 text-sm leading-relaxed italic border-l-2 border-amber-500/30 pl-3 py-1">
        "{review.comment}"
      </p>
    </div>
  );
}
