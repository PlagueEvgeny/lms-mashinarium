import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';

const HLSPlayer = ({ src }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    // Native HLS (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // HLS.js
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
          setError(true);
          hls.destroy();
        }
      });

      return () => hls.destroy();
    } else {
      setError(true);
    }
  }, [src]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-white">
        Ошибка загрузки видео
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      className="w-full h-full bg-black"
    />
  );
};

export default HLSPlayer;
