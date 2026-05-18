import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export default function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isAdult = Cookies.get('ageVerified');
    if (!isAdult) {
      setShow(true);
    }
  }, []);

  const handleVerify = () => {
    Cookies.set('ageVerified', 'true', { expires: 365, path: '/' });
    setShow(false);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#111] border border-[#2a2a2a] p-8 rounded-2xl max-w-md text-center shadow-[0_0_50px_rgba(128,0,0,0.3)]">
        <h2 className="text-3xl font-bold text-white mb-4">Age Restricted Content</h2>
        <p className="text-gray-400 mb-8">
          This website contains age-restricted content. You must be at least 18 years old to enter.
        </p>
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleVerify}
            className="w-full bg-wine-600 hover:bg-wine-700 text-white font-bold py-3 rounded-lg transition-colors text-lg"
          >
            Yes, I am 18+
          </button>
          <button 
            onClick={handleDecline}
            className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white font-medium py-3 rounded-lg transition-colors"
          >
            No, I am under 18
          </button>
        </div>
      </div>
    </div>
  );
}
