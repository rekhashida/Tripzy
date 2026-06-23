import React, { useState } from 'react';
import { FiStar, FiMessageSquare } from 'react-icons/fi';
import api from '../services/api';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

export default function RatingModal({ isOpen, onClose, rideId, parcelId, driverId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      setMsg('Please select a rating between 1 and 5');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      await api.post('/ratings', {
        ride_id: rideId,
        parcel_id: parcelId,
        driver_id: driverId,
        rating: rating,
        comment: comment || null
      });
      setMsg('Thank you for your feedback!');
      setMsgType('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setRating(5);
        setComment('');
      }, 2000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to submit rating');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rate Your Experience"
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>
          Rating
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '2.5rem',
                color: star <= rating ? '#fbbf24' : 'var(--text-muted)',
                transition: 'var(--transition)',
                padding: '0.25rem'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <FiStar fill={star <= rating ? '#fbbf24' : 'none'} />
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {rating === 5 && 'Excellent!'}
          {rating === 4 && 'Very Good'}
          {rating === 3 && 'Good'}
          {rating === 2 && 'Fair'}
          {rating === 1 && 'Poor'}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">
          <FiMessageSquare style={{ marginRight: '0.5rem' }} />
          Comment (Optional)
        </label>
        <textarea
          className="form-textarea"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
        />
      </div>

      {msg && (
        <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`} style={{ marginBottom: '1rem' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
