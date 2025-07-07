
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 md:p-6">
       <div className="w-full max-w-7xl">
         <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/">
                    <ArrowLeft />
                    <span className="sr-only">Back to game</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Game Report</h1>
        </div>
        {children}
       </div>
    </div>
  );
}
