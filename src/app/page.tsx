
'use client';

import { ChessBoard } from '@/components/chess-board';
import { GameSidebar } from '@/components/game-sidebar';
import { AnalysisSidebar } from '@/components/analysis-sidebar';
import { useChessGame } from '@/hooks/use-chess-game';
import { Loader2, Menu, Crown, Clock, Handshake, Flag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ChessPieceDisplay } from '@/components/chess-piece';

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
    if (!game.gameOver) return { title: '', description: '', icon: Crown };
    const { status, winner } = game.gameOver;
    switch (status) {
      case 'Checkmate':
        return { title: 'Checkmate!', description: `${winner} wins the game.`, icon: Crown };
      case 'Draw by Agreement':
        return { title: 'Draw', description: 'The game is a draw by agreement.', icon: Handshake };
      case 'Stalemate':
        return { title: 'Stalemate!', description: 'The game is a draw by stalemate.', icon: Handshake };
      case 'Threefold Repetition':
        return { title: 'Draw', description: 'The game is a draw by threefold repetition.', icon: Handshake };
      case 'Timeout':
        return { title: 'Timeout!', description: `${winner} wins on time.`, icon: Clock };
      case 'Resignation':
        return { title: 'Resignation', description: `${winner} wins by resignation.`, icon: Flag };
      default:
        return { title: 'Game Over', description: 'The game has ended.', icon: Crown };
    }
  };

  const { title: gameOverTitle, description: gameOverDescription, icon: GameOverIcon } = getGameOverMessage();

  if (isAuthenticating || !game.isMounted) {
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
                        <GameOverIcon className="w-6 h-6 text-yellow-400" />
                        {gameOverTitle}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {gameOverDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" asChild>
                       <Link href={game.pgn ? `/analysis?pgn=${encodeURIComponent(game.pgn)}` : '#'}>Game Report</Link>
                    </Button>
                    <AlertDialogAction onClick={game.resetGame}>
                        Play Again
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!game.pendingMove} onOpenChange={(open) => !open && game.cancelMove()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Move</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to play the move {game.pendingMove?.san}?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={game.confirmMove}>
                        Confirm
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!game.promotionMove} onOpenChange={(open) => !open && game.cancelPromotion()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Promote Pawn</DialogTitle>
                </DialogHeader>
                <div className="flex justify-around p-4">
                    {(['q', 'r', 'b', 'n'] as const).map((p) => (
                        <div key={p} className="w-16 h-16 cursor-pointer hover:bg-muted rounded-md p-2" onClick={() => game.handlePromotion(p)}>
                            <ChessPieceDisplay piece={{type: p, color: game.turn}} pieceSet={game.pieceSet} />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>

      </main>
      <AnalysisSidebar {...game} className="hidden md:flex" />
    </div>
  );
}
