import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Tarmoq holati"
      className="bg-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 sticky top-14 z-20 shadow-sm"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>Oflayn rejim — Barcha ma'lumotlar qurilmangizda xavfsiz saqlanmoqda.</span>
    </aside>
  );
};
