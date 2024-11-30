import StatCalculator from '@/components/StatCalculator';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stat Calculator - LOTRO Tools',
  description: 'Calculate derived stats for your character in LOTRO.',
};

export default function StatCalculatorPage() {
  return (
    <main className="container mx-auto p-4">
      <StatCalculator />
    </main>
  );
}