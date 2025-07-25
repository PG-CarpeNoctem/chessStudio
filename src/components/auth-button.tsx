
'use client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, Star, LogOut, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import Link from 'next/link';

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [elo, setElo] = useState(1200);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const updateUserState = () => {
      const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedInStatus);
      if (loggedInStatus) {
          setUsername(localStorage.getItem('username') || 'PlayerOne');
          setAvatar(localStorage.getItem('chess:avatar'));
          setElo(1200); // Placeholder ELO
      } else {
          setUsername(null);
          setAvatar(null);
      }
    };

    updateUserState();

    const handleStorageChange = (e: StorageEvent) => {
        if(['isLoggedIn', 'username', 'chess:avatar', 'email'].includes(e.key || '')) {
            updateUserState();
        }
    }
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for changes from the settings page in the same tab
    const handleProfileChange = () => updateUserState();
    window.addEventListener('profileChanged', handleProfileChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileChanged', handleProfileChange);
    }

  }, [isMounted]);
  
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('chess:avatar');
    localStorage.removeItem('email');
    setIsLoggedIn(false);
    setUsername(null);
    setAvatar(null);
    router.replace('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  }

  if (!isMounted) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    );
  }

  if (isLoggedIn && username) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-3 text-left w-full hover:bg-sidebar-accent p-1 rounded-md transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar || undefined} alt={username} />
              <AvatarFallback>
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{username}</span>
              <span className="text-xs text-muted-foreground">View Profile</span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56" side="right" align="start" sideOffset={10}>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatar || undefined} alt={username} />
                <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{username}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ELO Rating</span>
                <span className="font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" /> {elo}
                </span>
              </div>
            </div>
             <Button asChild variant="ghost" size="sm" className="w-full justify-start -mx-1">
                <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </Link>
            </Button>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full justify-start -mx-1">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Button onClick={handleLogin} size="sm">
      <LogIn className="mr-2 h-4 w-4" />
      Login to Play
    </Button>
  );
}
