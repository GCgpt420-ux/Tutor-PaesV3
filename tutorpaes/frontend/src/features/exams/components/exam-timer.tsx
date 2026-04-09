'use client';

import { useMemo } from 'react';

interface ExamTimerProps {
  timeLeft: number; // en segundos
  totalSeconds: number;
}

export function ExamTimer({ timeLeft, totalSeconds }: ExamTimerProps) {
  const { minutes, seconds, percentage, isWarning } = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const pct = (timeLeft / totalSeconds) * 100;
    const warning = timeLeft < 300; // Menos de 5 minutos

    return {
      minutes: mins,
      seconds: secs,
      percentage: pct,
      isWarning: warning,
    };
  }, [timeLeft, totalSeconds]);

  const getColors = () => {
    if (timeLeft <= 60) return { text: 'text-brand-danger', bg: 'bg-brand-danger/10 border-brand-danger/20', fill: 'bg-brand-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]' };
    if (isWarning) return { text: 'text-warning', bg: 'bg-warning/10 border-warning/20', fill: 'bg-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]' };
    return { text: 'text-success', bg: 'bg-success/10 border-success/20', fill: 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' };
  };

  const colors = getColors();

  return (
    <div className={`flex flex-col items-center gap-2 px-5 py-3 rounded-2xl glass-card backdrop-blur-xl ${colors.bg} transition-all duration-500`}>
      <div className={`text-2xl font-black tabular-nums tracking-tight ${colors.text}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${colors.fill}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${colors.text}`}>
        {timeLeft <= 60 ? 'Inminente' : 'Cronómetro'}
      </p>
    </div>
  );
}
