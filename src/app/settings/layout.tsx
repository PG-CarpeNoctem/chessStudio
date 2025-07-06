
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
        <div className="grid gap-8 md:grid-cols-[200px_1fr]">
            <nav className="flex flex-col gap-2 text-lg text-muted-foreground">
                <Link href="#profile" className="flex items-center gap-2 rounded-md px-3 py-2 font-medium hover:bg-accent hover:text-accent-foreground">
                   <UserCircle className="h-5 w-5" />
                   Profile
                </Link>
                <Link href="#appearance" className="flex items-center gap-2 rounded-md px-3 py-2 font-medium hover:bg-accent hover:text-accent-foreground">
                    <Palette className="h-5 w-5" />
                    Appearance
                </Link>
            </nav>
            <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
