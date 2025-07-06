'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserCircle, Palette, Gamepad2 } from 'lucide-react';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { GameplaySettings } from '@/components/settings/gameplay-settings';

// --- Main Settings Page Component ---
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const navItems = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Settings</h2>
        <nav className="flex flex-row md:flex-col gap-1">
          {navItems.map(item => (
            <Button
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className="justify-start"
                onClick={() => setActiveTab(item.id)}
            >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'gameplay' && <GameplaySettings />}
      </main>
    </div>
  );
}
