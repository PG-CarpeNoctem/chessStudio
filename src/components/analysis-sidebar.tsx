
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { useChessGame } from '@/hooks/use-chess-game';
import { BrainCircuit, Loader2, Lightbulb, ClipboardCopy, Bot } from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';

type AnalysisSidebarProps = Pick<ReturnType<typeof useChessGame>, 
    'pgn' | 'history' | 'isAITurn' | 'getHint' | 'gameOver' | 
    'time' | 'isMounted' | 'gameMode' | 'skillLevel'
> & {
  className?: string;
};

const formatTime = (ms: number, isGameOver: boolean, historyLength: number) => {
    if (historyLength === 0 && ms === Infinity) return '10:00'; // Default before game starts
    if (ms === Infinity) return '∞';
    if (isGameOver && ms <= 0) return "00:00";
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const PlayerCard = ({ name, avatarSrc, isOpponent = false, time, subtitle, elo }: { name: string, avatarSrc: string | null, isOpponent?: boolean, time: string, subtitle?: string | null, elo?: number }) => (
  <Card className="bg-sidebar-accent border-sidebar-border">
    <CardContent className="p-3">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarSrc || undefined} alt={name} />
            <AvatarFallback>{isOpponent ? <Bot className="h-5 w-5" /> : name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{name} {elo && `(${elo})`}</span>
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        </div>
        <div className="bg-background/20 text-foreground font-mono text-lg rounded-md px-4 py-1.5 flex-shrink-0">
          {time}
        </div>
      </div>
    </CardContent>
  </Card>
);


export function AnalysisSidebar({ 
    pgn, history, isAITurn, getHint, gameOver, 
    time, isMounted, gameMode, className, skillLevel
}: AnalysisSidebarProps) {
  const [username, setUsername] = useState('Player');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userElo, setUserElo] = useState(1200);

  useEffect(() => {
    if (!isMounted) return;

    const updateUserState = () => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
        setAvatar(localStorage.getItem('chess:avatar'));
        // For now, we'll use a static ELO, but this could come from user data
        setUserElo(1200);
    }
    updateUserState();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'username' || e.key === 'chess:avatar') {
        updateUserState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileChanged', updateUserState);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileChanged', updateUserState);
    };
  }, [isMounted]);

  const handleCopyPgn = () => {
    if (pgn) {
        navigator.clipboard.writeText(pgn);
    }
  };

  const movePairs: [any, any | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

  const formattedTimeW = formatTime(time.w, !!gameOver, history.length);
  const formattedTimeB = formatTime(time.b, !!gameOver, history.length);

  const opponentName = gameMode === 'ai' ? 'AI Opponent' : 'Player 2';
  const opponentElo = gameMode === 'ai' ? 800 + skillLevel * 100 : 1200;
  const opponentSubtitle = gameMode === 'ai' ? `Level ${skillLevel}` : 'Local Player';

  if (!isMounted) {
    return (
      <aside className={cn("w-[260px] flex-shrink-0 flex flex-col gap-4 p-4 bg-sidebar text-sidebar-foreground border-l border-sidebar-border", className)}>
        <Skeleton className="h-[68px] w-full" />
        <Skeleton className="flex-1 w-full" />
        <Skeleton className="h-[68px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[60px] w-full" />
      </aside>
    );
  }

  return (
    <aside className={cn("w-[260px] flex-shrink-0 flex flex-col gap-4 p-4 bg-sidebar text-sidebar-foreground border-l border-sidebar-border", className)}>
      <PlayerCard 
        name={opponentName}
        avatarSrc={null} 
        isOpponent={true} 
        time={formattedTimeB}
        subtitle={opponentSubtitle}
        elo={opponentElo}
      />
      
      <Card className="flex-1 flex flex-col bg-sidebar-accent border-sidebar-border overflow-hidden">
        <CardHeader className='pb-2'>
            <CardTitle className="flex items-center justify-between text-base">
                Move History
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyPgn} title="Copy PGN">
                        <ClipboardCopy className="h-4 w-4" />
                    </Button>
                    {isAITurn && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
            </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <table className="move-history-table">
              <tbody>
                {movePairs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-muted-foreground p-4">No moves yet.</td>
                  </tr>
                ) : (
                  movePairs.map((pair, index) => (
                    <tr key={index}>
                      <td className="move-number">{index + 1}.</td>
                      <td className="move-san">{pair[0]?.san}</td>
                      <td className="move-san">{pair[1]?.san}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <PlayerCard 
        name={username} 
        avatarSrc={avatar}
        time={formattedTimeW}
        elo={userElo}
      />
      
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader className='pb-3 pt-4'>
            <CardTitle className="flex items-center gap-2 text-base"><Lightbulb /> Coaching</CardTitle>
        </CardHeader>
        <CardContent className='p-3 pt-0'>
            <Button 
            onClick={getHint} 
            disabled={isAITurn || !!gameOver || gameMode !== 'ai'} 
            className="w-full"
            variant="outline"
            >
            <Lightbulb className="mr-2 h-4 w-4" />
            Get a Hint
            </Button>
        </CardContent>
      </Card>

      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardContent className='p-3'>
          <Button asChild className="w-full" disabled={!pgn}>
              <Link href={pgn ? `/analysis?pgn=${encodeURIComponent(pgn)}` : '#'}>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Game Report
              </Link>
          </Button>
        </CardContent>
      </Card>
    </aside>
  )
}
