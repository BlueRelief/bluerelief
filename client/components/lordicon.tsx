"use client"

import { useEffect, useRef, useState } from 'react';
import { Player } from '@lordicon/react';

interface LordiconProps {
  src: string;
  trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'play-once-then-hover';
  size?: number;
  state?: string;
  colorize?: string;
  onComplete?: () => void;
}

export function Lordicon({
  src,
  trigger = 'hover',
  size = 32,
  state,
  colorize,
  onComplete,
}: LordiconProps) {
  const initialized = useRef(false);
  const hasPlayedOnce = useRef(false);
  const playerRef = useRef<Player>(null);
  const [iconData, setIconData] = useState<Record<string, unknown> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetch(src)
      .then(res => res.json())
      .then(data => setIconData(data))
      .catch(err => console.error('Failed to load icon:', err));
  }, [src]);

  const handleReady = () => {
    setIsReady(true);
    
    if (trigger === 'loop' || trigger === 'play-once-then-hover') {
      setTimeout(() => {
        playerRef.current?.playFromBeginning();
        if (trigger === 'play-once-then-hover') {
          hasPlayedOnce.current = true;
        }
      }, 100);
    }
  };

  const handleComplete = () => {
    if (!playerRef.current) return;
    
    if (trigger === 'loop') {
      // Loop the animation
      playerRef.current.playFromBeginning();
    }
    
    onComplete?.();
  };

  const handleMouseEnter = () => {
    if (!playerRef.current || !isReady) return;
    
    if (trigger === 'hover') {
      playerRef.current.playFromBeginning();
    } else if (trigger === 'play-once-then-hover' && hasPlayedOnce.current) {
      playerRef.current.playFromBeginning();
    }
  };

  const handleMouseLeave = () => {
    // Nothing to do on leave
  };

  const handleClick = () => {
    if (!playerRef.current || !isReady) return;
    
    if (trigger === 'click') {
      playerRef.current.playFromBeginning();
    }
  };

  if (!iconData) {
    return <div style={{ width: size, height: size }} />;
  }

  return (
    <span
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-block',
        lineHeight: 1,
        cursor: trigger === 'click' ? 'pointer' : 'default' 
      }}
    >
      <Player
        ref={playerRef}
        icon={iconData}
        size={size}
        state={state}
        colorize={colorize}
        onReady={handleReady}
        onComplete={handleComplete}
      />
    </span>
  );
}

