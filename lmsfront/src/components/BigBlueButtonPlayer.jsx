import React, { useRef } from 'react';
import { Maximize2 } from 'lucide-react';

const BigBlueButtonPlayer = ({ url, title }) => {
  const iframeRef = useRef(null);

  const handleFullScreen = () => {
    if (!iframeRef.current) return;
    if (iframeRef.current.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    } else if (iframeRef.current.webkitRequestFullscreen) { /* Safari */
      iframeRef.current.webkitRequestFullscreen();
    } else if (iframeRef.current.msRequestFullscreen) { /* IE11 */
      iframeRef.current.msRequestFullscreen();
    }
  };

  if (!url) return null;

  return (
    <div className="relative w-full bg-black" style={{ height: '50vh' }}>
      <iframe
        ref={iframeRef}
        src={url}
        title={title || 'BBB Player'}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
      />
      {/* Fullscreen button */}
      <button
        onClick={handleFullScreen}
        className="absolute top-3 left-3 bg-black/70 text-white p-2 rounded-lg hover:bg-black/90 flex items-center gap-1"
      >
        <Maximize2 size={16} />
        Fullscreen
      </button>
    </div>
  );
};

export default BigBlueButtonPlayer;
