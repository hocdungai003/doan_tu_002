import React, { useEffect, useState } from 'react';
import { Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  duration: number;
  onTimeout: () => void;
  isActive: boolean;
  reset: boolean;
}

export function Timer({ duration, onTimeout, isActive, reset }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [reset, duration]);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [duration, onTimeout, isActive]);

  const progress = (timeLeft / duration) * 100;

  return (
    <div className="flex items-center gap-2">
      <TimerIcon className="w-5 h-5 text-blue-600" />
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-sm font-medium">{timeLeft}s</span>
    </div>
  );
}