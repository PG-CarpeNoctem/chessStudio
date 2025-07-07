'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserCircle, Palette, Gamepad2, Laptop, Users, Bell, LifeBuoy, Shield, Gem, Accessibility } from 'lucide-react';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { BoardPiecesSettings } from '@/components/settings/board-pieces-settings';
import { GameplaySettings } from '@/components/settings/gameplay-settings';
import { SocialSettings } from '@/components/settings/social-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ComingSoon = ({ title }: { title: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Customize your {title.toLowerCase()} settings.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center h-48 bg-muted/50 rounded-md">
                <p className="text-muted-foreground">This section is coming soon!</p>
            </div>
        </CardContent>
    </Card>
);


// --- Main Settings Page Component ---
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('social');

  const navItems = [
    { id: 'board-pieces', label: 'Board & Pieces', icon: Palette, component: <BoardPiecesSettings /> },
    { id: 'gameplay', label: 'Gameplay', icon: Gamepad2, component: <GameplaySettings /> },
    { id: 'profile', label: 'Profile', icon: UserCircle, component: <ProfileSettings /> },
    { id: 'interface', label: 'Interface', icon: Laptop, component: <ComingSoon title="Interface" /> },
    { id: 'social', label: 'Social', icon: Users, component: <SocialSettings /> },
    { id: 'coach', label: 'Coach', icon: LifeBuoy, component: <ComingSoon title="Coach" /> },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: <ComingSoon title="Notifications" /> },
    { id: 'account', label: 'Account', icon: Shield, component: <ComingSoon title="Account" /> },
    { id: 'membership', label: 'Membership', icon: Gem, component: <ComingSoon title="Membership" /> },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility, component: <ComingSoon title="Accessibility" /> },
  ];
  
  const activeComponent = navItems.find(item => item.id === activeTab)?.component;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Settings</h2>
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {navItems.map(item => (
            <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className="justify-start shrink-0"
                onClick={() => setActiveTab(item.id)}
            >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
          {activeComponent}
      </main>
    </div>
  );
}
