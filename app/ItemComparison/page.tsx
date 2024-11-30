import ItemComparison from '@/components/ItemComparison';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Item Comparison - LOTRO Tools',
  description: 'Compare derived stats between two items in LOTRO',
};

export default function ItemComparisonPage() {
  return (
    <main className="container mx-auto p-4">
      <ItemComparison />
    </main>
  );
}