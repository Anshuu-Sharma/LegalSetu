import React, { useEffect, useRef, useState } from 'react';
import { useTTS } from '../contexts/ttsContext';

interface VoicePlayerProps {
  text: string;
  language?: string;
  index?: number; // Optional if tracking per message
}

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:4000' // Local backend during development
  : import.meta.env.VITE_API_URL || '';


const VoicePlayer: React.FC<VoicePlayerProps> = ({ text, language = 'en', index }) => {
  const { ttsEnabled } = useTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      // Clean up when unmounted
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

const handlePlay = async () => {
  if (!ttsEnabled || !text?.trim()) return;

  try {
    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const res = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });

    const data = await res.json();
    console.log('🔊 TTS Response:', data); // 👈 Debug line

    if (!data.audioUrl) throw new Error('TTS audio failed');

    const audio = new Audio(`${API_BASE}${data.audioUrl}`);
    audioRef.current = audio;

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.error('🔈 Playback error:', err);
      setIsPlaying(false);
    });

    audio.onended = () => {
      setIsPlaying(false);
    };
    audio.onerror = (e) => {
      console.error('🎵 Audio failed to load/play:', e);
      setIsPlaying(false);
    };
  } catch (err) {
    console.error('❌ TTS Error:', err);
    setIsPlaying(false);
  }
};


  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={isPlaying ? handleStop : handlePlay}
      title={isPlaying ? 'Stop voice playback' : 'Play voice'}
      disabled={isLoading}
      className={`p-1 rounded-full transition-colors duration-200 ${
        isPlaying
          ? 'text-blue-600 hover:text-blue-700'
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {isLoading ? '⏳' : isPlaying ? '⏹️' : '🔊'}
    </button>
  );
};

export default VoicePlayer;
