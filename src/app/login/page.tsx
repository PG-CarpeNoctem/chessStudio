'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Puzzle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleAuth = (e: React.FormEvent, type: 'login' | 'signup') => {
    e.preventDefault();
    // In a real app, you'd validate credentials against a backend here.
    // For this demo, we'll just simulate a successful authentication.
    if (type === 'signup') {
        localStorage.setItem('username', username);
    }
    localStorage.setItem('isLoggedIn', 'true');
    router.replace('/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Puzzle className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-headline">PGChess</CardTitle>
          </div>
          <CardDescription>Welcome! Login or create an account to play.</CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <form onSubmit={(e) => handleAuth(e, 'login')}>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                            id="login-email"
                            type="email"
                            placeholder="player@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                            id="login-password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                        Login
                        </Button>
                    </CardFooter>
                </form>
            </TabsContent>
            <TabsContent value="signup">
                 <form onSubmit={(e) => handleAuth(e, 'signup')}>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="signup-username">Username</Label>
                            <Input
                                id="signup-username"
                                type="text"
                                placeholder="PlayerOne"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="player@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            Create Account
                        </Button>
                    </CardFooter>
                </form>
            </TabsContent>
        </Tabs>
      </Card>
    </main>
  );
}
