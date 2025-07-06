
'use client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    router.replace('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://placehold.co/40x40.png" alt="@playerone" data-ai-hint="avatar abstract" />
          <AvatarFallback>
            <Skeleton className="h-8 w-8 rounded-full" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">PlayerOne</span>
          <button
            className="text-xs text-muted-foreground hover:text-primary transition-colors text-left"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} size="sm">
      <LogIn className="mr-2 h-4 w-4" />
      Login to Play
    </Button>
  );
}
