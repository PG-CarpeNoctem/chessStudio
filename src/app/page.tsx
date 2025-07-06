
'use client';

import { ChessBoard } from '@/components/chess-board';
import { GameSidebar } from '@/components/game-sidebar';
import { AnalysisSidebar } from '@/components/analysis-sidebar';
import { useChessGame } from '@/hooks/use-chess-game';
import { Loader2, Menu, Crown, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Home() {
  const game = useChessGame();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    // This check runs only on the client-side
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      router.replace('/login');
    } else {
      setIsAuthenticating(false);
    }
  }, [router]);

  const getGameOverMessage = () => {
    if (!game.gameOver) return { title: '', description: '' };
    const { status, winner } = game.gameOver;
    switch (status) {
      case 'Checkmate':
        return { title: 'Checkmate!', description: `${winner} wins the game.` };
      case 'Draw':
        return { title: 'Draw', description: 'The game is a draw by agreement.' };
      case 'Stalemate':
        return { title: 'Stalemate!', description: 'The game is a draw by stalemate.' };
      case 'Threefold Repetition':
        return { title: 'Draw', description: 'The game is a draw by threefold repetition.' };
      case 'Timeout':
        return { title: 'Timeout!', description: `${winner} wins on time.` };
      default:
        return { title: 'Game Over', description: 'The game has ended.' };
    }
  };

  const { title: gameOverTitle, description: gameOverDescription } = getGameOverMessage();

  if (isAuthenticating) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <GameSidebar {...game} className="hidden md:flex" />
      <main className="flex flex-1 flex-col items-center justify-center p-2 md:p-4 relative">
        <div className="md:hidden absolute top-4 left-4 z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[260px] bg-transparent border-0">
              <GameSidebar {...game} className="w-full h-full border-r-0" />
            </SheetContent>
          </Sheet>
        </div>
        <div className="md:hidden absolute top-4 right-4 z-10">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-[260px] bg-transparent border-0">
              <AnalysisSidebar {...game} className="w-full h-full border-l-0" />
            </SheetContent>
          </Sheet>
        </div>

        <div className="w-full max-w-2xl aspect-square">
          <ChessBoard {...game} />
        </div>

        <AlertDialog open={!!game.gameOver}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {game.gameOver?.status === 'Timeout' ? <Clock className="w-6 h-6 text-orange-400" /> : <Crown className="w-6 h-6 text-yellow-400" />}
                        {gameOverTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {gameOverDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={game.resetGame}>
                        Play Again
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </main>
      <AnalysisSidebar {...game} className="hidden md:flex" />
    </div>
  );
}
