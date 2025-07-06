
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background">
      <div className="w-full max-w-4xl p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/">
                    <ArrowLeft />
                </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
