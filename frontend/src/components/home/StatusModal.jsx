import React from 'react';

const StatusModal = ({ isOpen, type, message, onClose }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center text-center animate-scale-up relative z-10">
        
        {/* Animated Icon Circle */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${
          isSuccess ? 'bg-success-light' : 'bg-error-light animate-shake'
        }`}>
          {isSuccess ? (
            // Success Checkmark
            <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                className="animate-draw-check" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="3" 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          ) : (
            // Failure X Icon
            <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="3" 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          )}
        </div>

        {/* Text */}
        <h3 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-gray-800' : 'text-error'}`}>
          {isSuccess ? 'Booking Confirmed!' : 'Booking Failed'}
        </h3>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          {message}
        </p>

        {/* Button */}
        <button 
          onClick={onClose}
          className={`px-8 py-3 rounded-full font-semibold text-white shadow-md transition-transform active:scale-95 ${
            isSuccess ? 'bg-success hover:bg-success-dark' : 'bg-error hover:bg-error-dark'
          }`}
        >
          {isSuccess ? 'Done' : 'Try Again'}
        </button>
      </div>
    </div>
  );
};

export default StatusModal;