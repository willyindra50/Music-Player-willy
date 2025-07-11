'use client';

import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Loader2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, Variants, TargetAndTransition } from 'framer-motion';

const tracks = [
  {
    title: 'Night Changes',
    artist: 'One Direction',
    src: '/music1.mp3',
    cover: '/cover1.png',
  },
  {
    title: 'Girl Like You',
    artist: 'Maroon 5',
    src: '/music2.mp3',
    cover: '/cover2.png',
  },
  {
    title: 'Sweet Child o Mine',
    artist: 'Guns N Roses',
    src: '/music3.mp3',
    cover: '/cover3.png',
  },
  {
    title: 'When I Was Your Man',
    artist: 'Bruno Mars',
    src: '/music4.mp3',
    cover: '/cover4.png',
  },
  {
    title: 'Somebody To Love',
    artist: 'Queen',
    src: '/music5.mp3',
    cover: '/cover5.png',
  },
];

const playerVariants = {
  playing: {
    backgroundColor: '#1a1a1a',
    boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
  },
  paused: {
    backgroundColor: '#0f0f0f',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
  },
  loading: {
    backgroundColor: '#0f0f0f',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
  },
};

const albumArtVariants: Variants = {
  playing: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 20,
      ease: 'linear',
    },
  },
  paused: {
    rotate: 0,
    scale: 0.95,
  },
  loading: {
    rotate: 0,
    scale: 0.9,
    opacity: 0.5,
  },
};

const getEqualizerVariant = (
  state: 'playing' | 'paused' | 'loading',
  i: number
): TargetAndTransition => {
  switch (state) {
    case 'playing':
      return {
        scaleY: [0.2, 1, 0.2],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: i * 0.1,
          ease: 'easeInOut',
        },
      };
    case 'loading':
      return {
        scaleY: 0.5,
        opacity: 0.5,
      };
    case 'paused':
    default:
      return {
        scaleY: 0.2,
      };
  }
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(1, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function Page() {
  const [state, setState] = useState<'playing' | 'paused' | 'loading'>(
    'paused'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(60);
  const [duration, setDuration] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setState('loading');

    if (audio.readyState < 3) {
      await new Promise((resolve) =>
        audio.addEventListener('canplaythrough', resolve, { once: true })
      );
    }

    if (isPlaying) {
      audio.pause();
      setState('paused');
    } else {
      audio.play();
      setState('playing');
      const updateProgress = () => {
        setProgress(audio.currentTime);
        if (!audio.paused) {
          requestAnimationFrame(updateProgress);
        }
      };
      requestAnimationFrame(updateProgress);
    }

    setIsPlaying(!isPlaying);
    setIsLoading(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;

    const update = () => {
      setProgress(audio.currentTime);
      animationFrameId = requestAnimationFrame(update);
    };

    const updateDuration = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('play', () => {
      animationFrameId = requestAnimationFrame(update);
    });
    audio.addEventListener('pause', () => {
      cancelAnimationFrame(animationFrameId);
    });
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadeddata', updateDuration);

    return () => {
      cancelAnimationFrame(animationFrameId);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadeddata', updateDuration);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  const currentTrack = tracks[currentTrackIndex];

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1));
    setIsPlaying(false);
    setState('paused');
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev === tracks.length - 1 ? 0 : prev + 1));
    setIsPlaying(false);
    setState('paused');
    setProgress(0);
  };

  if (!isClient) return null;

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#0b0d12] px-4'>
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload='metadata'
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (!isNaN(d)) setDuration(d);
        }}
      />

      <motion.div
        className='w-full max-w-[500px] h-[350px] rounded-2xl p-6 flex flex-col justify-between text-white'
        variants={playerVariants}
        animate={state}
        initial='paused'
      >
        <div className='flex items-start gap-6'>
          <motion.div
            variants={albumArtVariants}
            animate={state}
            className='rounded-xl shrink-0'
          >
            <Image
              src={currentTrack.cover}
              alt='cover'
              width={120}
              height={120}
              className='rounded-xl'
            />
          </motion.div>

          <div className='mt-[26px] flex flex-col ml-6'>
            <h1 className='text-lg font-semibold text-white mb-[8px]'>
              {currentTrack.title}
            </h1>
            <p className='text-sm font-regular text-[#a4a7ae]'>
              {currentTrack.artist}
            </p>
            <div className='flex gap-4 w-[56px] h-[32px] items-end mt-[26px]'>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className='w-8 h-full bg-[#a872fa] origin-bottom rounded-full'
                  animate={getEqualizerVariant(state, i)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className='mt-2'>
          <div className='relative w-full h-8'>
            <div className='absolute inset-0 h-8 top-1/2 -translate-y-1/2 bg-neutral-800 rounded-full' />
            <div
              className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-full ${
                state === 'playing'
                  ? 'bg-purple-200'
                  : state === 'loading'
                  ? 'bg-neutral-500'
                  : 'bg-neutral-800'
              }`}
              style={{ width: `${(progress / duration) * 100 || 0}%` }}
            />
            <div
              className='absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full z-20 shadow-md'
              style={{
                left: `calc(${(progress / duration) * 100 || 0}% - 8px)`,
              }}
            />
            <input
              type='range'
              min='0'
              max={duration}
              step='0.1'
              value={progress}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className='absolute top-0 left-0 w-full h-8 opacity-0 cursor-pointer z-30'
            />
          </div>
          <div className='flex justify-between text-xs text-[#717680] mt-1'>
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className='flex justify-center items-center gap-20 mt-4'>
          <Shuffle size={24} />
          <SkipBack size={24} className='cursor-pointer' onClick={handlePrev} />
          <motion.button
            className={`min-w-[48px] h-[48px] rounded-full flex items-center justify-center ${
              isLoading ? 'bg-[#717680]' : 'bg-[#a872fa]'
            }`}
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            onClick={handleToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className='animate-spin text-white' size={24} />
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} />
            )}
          </motion.button>
          <SkipForward
            size={24}
            className='cursor-pointer'
            onClick={handleNext}
          />
          <Repeat size={24} />
        </div>

        <div className='flex items-center gap-2 mt-4'>
          <Image
            src='/volume-icon.png'
            alt='Volume Icon'
            width={20}
            height={20}
          />
          <div className='relative w-full h-4'>
            <div className='absolute inset-0 bg-neutral-800 rounded-full h-4 top-1/2 -translate-y-1/2' />
            <div
              className='absolute top-1/2 -translate-y-1/2 bg-neutral-500 group-hover:bg-purple-200 h-8 rounded-full transition-all'
              style={{ width: `${volume}%` }}
            />
            <div
              className='absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full z-20 shadow-md'
              style={{ left: `calc(${volume}% - 8px)` }}
            />
            <input
              type='range'
              min='0'
              max='100'
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className='absolute top-0 left-0 w-full h-8 opacity-0 cursor-pointer z-30'
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
