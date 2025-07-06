'use client';

import { ChessBoard } from '@/components/chess-board';
import { GameSidebar } from '@/components/game-sidebar';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { useChessGame } from '@/hooks/use-chess-game';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const game = useChessGame();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full">
        <Sidebar>
          <GameSidebar {...game} />
        </Sidebar>
        <SidebarInset>
          <main className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-[calc(100vh-10rem)] aspect-square">
              <ChessBoard {...game} />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
