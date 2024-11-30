import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="container mx-auto min-h-screen flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">LOTRO Tools</h1>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/StatCalculator">
          <Button className="w-48 h-16">
            Stat Calculator
          </Button>
        </Link>

        <Link href="/ItemComparison">
          <Button className="w-48 h-16">
            Item Comparison
          </Button>
        </Link>
      </div>
    </main>
  );
}