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
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State for login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State for signup form
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const users = JSON.parse(localStorage.getItem('pgchess_users') || '[]');
      const user = users.find(
        (u: any) => u.email === loginEmail && u.password === loginPassword
      );

      if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user.username);
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${user.username}!`,
        });
        router.replace('/');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Could not process your login request.',
      });
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const users = JSON.parse(localStorage.getItem('pgchess_users') || '[]');
      const existingUser = users.find((u: any) => u.email === signupEmail);

      if (existingUser) {
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: 'An account with this email already exists.',
        });
        return;
      }
      
      const newUser = { username: signupUsername, email: signupEmail, password: signupPassword };
      users.push(newUser);
      localStorage.setItem('pgchess_users', JSON.stringify(users));

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', signupUsername);
      
      toast({
          title: 'Account Created!',
          description: `Welcome to PGChess, ${signupUsername}!`,
      });

      router.replace('/');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: 'Could not create your account.',
        });
    }
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
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                            id="login-email"
                            type="email"
                            placeholder="player@example.com"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                            id="login-password"
                            type="password"
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
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
                 <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="signup-username">Username</Label>
                            <Input
                                id="signup-username"
                                type="text"
                                placeholder="PlayerOne"
                                required
                                value={signupUsername}
                                onChange={(e) => setSignupUsername(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="player@example.com"
                                required
                                value={signupEmail}
                                onChange={(e) => setSignupEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                required
                                value={signupPassword}
                                onChange={(e) => setSignupPassword(e.target.value)}
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
