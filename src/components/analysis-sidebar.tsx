
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
import { BrainCircuit, Loader2, Lightbulb, ClipboardCopy } from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { ChessPiece } from '@/lib/types';
import Link from 'next/link';
import { ChessPieceDisplay } from './chess-piece';

type AnalysisSidebarProps = Pick<ReturnType<typeof useChessGame>, 
    'pgn' | 'history' | 'isAITurn' | 'getHint' | 'gameOver' | 
    'capturedPieces' | 'materialAdvantage' | 'time'
> & {
  className?: string;
};

const formatTime = (ms: number) => {
    if (ms === Infinity) return '∞';
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const PlayerCard = ({ name, avatarSrc, isOpponent = false, capturedPieces = [], materialAdvantage = 0, time }: { name: string, avatarSrc: string | null, isOpponent?: boolean, capturedPieces?: ChessPiece[], materialAdvantage?: number, time: number }) => (
  <Card className="bg-sidebar-accent border-sidebar-border">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc || (isOpponent ? 'https://placehold.co/40x40.png' : 'https://placehold.co/40x40.png')} data-ai-hint={isOpponent ? "avatar robot" : "avatar abstract"} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{name}</span>
            {(capturedPieces.length > 0 || materialAdvantage > 0) &&
              <div className="flex items-center gap-0.5 h-5 mt-0.5">
                {capturedPieces.map((p, i) => (
                  <div key={i} className="w-4 h-4 text-white">
                    <ChessPieceDisplay piece={p} pieceSet="classic" />
                  </div>
                ))}
                {materialAdvantage > 0 &&
                  <span className="text-xs font-bold text-lime-400/90 ml-1">
                    +{materialAdvantage}
                  </span>
                }
              </div>
            }
          </div>
        </div>
        <div className="bg-background/20 text-foreground font-mono text-lg rounded-md px-4 py-1">
          {formatTime(time)}
        </div>
      </div>
    </CardContent>
  </Card>
);

export function AnalysisSidebar({ 
    pgn, history, isAITurn, getHint, gameOver, capturedPieces, 
    materialAdvantage, time, className 
}: AnalysisSidebarProps) {
  const [username, setUsername] = useState('Player');
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const updateUserState = () => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
        setAvatar(localStorage.getItem('chess:avatar'));
    }
    updateUserState();
    
    window.addEventListener('profileChanged', updateUserState);
    window.addEventListener('storage', (e) => {
        if (e.key === 'username' || e.key === 'chess:avatar') {
            updateUserState();
        }
    });

    return () => {
      window.removeEventListener('profileChanged', updateUserState);
    };
  }, []);

  const handleCopyPgn = () => {
    if (pgn) {
        navigator.clipboard.writeText(pgn);
    }
  };

  const movePairs: [any, any | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

  // PlayerOne is white, AI Opponent is black.
  const playerCapturedPieces = capturedPieces.w; // White player captures black pieces.
  const opponentCapturedPieces = capturedPieces.b; // Black player captures white pieces.
  
  const playerAdvantage = materialAdvantage > 0 ? materialAdvantage : 0;
  const opponentAdvantage = materialAdvantage < 0 ? Math.abs(materialAdvantage) : 0;
  
  return (
    <aside className={cn("w-[260px] flex-shrink-0 flex flex-col gap-4 p-4 bg-sidebar text-sidebar-foreground border-l border-sidebar-border", className)}>
      <PlayerCard 
        name="AI Opponent" 
        avatarSrc={null} 
        isOpponent={true} 
        capturedPieces={opponentCapturedPieces}
        materialAdvantage={opponentAdvantage}
        time={time.b}
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
        capturedPieces={playerCapturedPieces}
        materialAdvantage={playerAdvantage}
        time={time.w}
      />
      
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader className='pb-3 pt-4'>
            <CardTitle className="flex items-center gap-2 text-base"><Lightbulb /> Coaching</CardTitle>
        </CardHeader>
        <CardContent className='p-3 pt-0'>
            <Button 
            onClick={getHint} 
            disabled={isAITurn || !!gameOver} 
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
