'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, BarChart, Users, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type GameRecord = {
  pgn: string;
  date: string;
  white: string;
  black: string;
  result: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  const loadHistory = () => {
    try {
      const storedHistory = localStorage.getItem('pgchess_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse game history from localStorage", e);
      toast({ variant: "destructive", title: "Error", description: "Could not load game history." });
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadHistory();
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('pgchess_history');
    setHistory([]);
    toast({ title: "History Cleared", description: "Your past games have been removed." });
  };
  
  if (!isMounted) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Loading Game History...</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Please wait...</p>
              </CardContent>
          </Card>
      );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Games Found</CardTitle>
          <CardDescription>You haven't played any games yet. Go play a game to see your history here!</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center h-48 bg-muted/50 rounded-md">
                <p className="text-muted-foreground">Your game history is empty.</p>
            </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Games</CardTitle>
        <CardDescription>Review your previously played games and analyze your performance.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Players</TableHead>
                <TableHead className="text-center">Result</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((game, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {game.black === 'AI Opponent' ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                      <span>{game.white} vs {game.black}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{game.result}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(game.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                       <Link href={`/analysis?pgn=${encodeURIComponent(game.pgn)}`}>
                        <BarChart className="mr-2 h-4 w-4" />
                        Analyze
                       </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your entire game history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

    