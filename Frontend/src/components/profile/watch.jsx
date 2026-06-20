import { useRef, useEffect } from 'react';
import videojs from 'video.js';

export default function StreamPlayer({ streamId }) {
  const videoRef = useRef(null);  
  const playerRef = useRef(null);
  useEffect(() => {
    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: 'play',
      preload: 'auto',
      sources: [
        {
          src: `http://localhost:8080/hls/${streamId}.m3u8`,
          type: 'application/x-mpegURL',
        },
      ],
    });
    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [streamId]);
  
  return <video ref={videoRef} className="video-js vjs-default-skin w-full h-full" />;
}