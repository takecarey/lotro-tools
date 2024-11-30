"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, X } from 'lucide-react';
import Papa from 'papaparse';

// Type definitions
interface StatData {
  type: string;
  value: string;
}

interface StatsDataRow {
  'Primary Stat': string;
  'Derived Stat': string;
  [className: string]: string | number;
}

interface ClassSelectorProps {
  selectedClass: string;
  classes: string[];
  onClassChange: (className: string) => void;
}

interface StatEntryProps {
  index: number;
  statType: string;
  statValue: string;
  availableStats: string[];
  onStatTypeChange: (index: number, value: string) => void;
  onStatValueChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

interface ItemSectionProps {
  title: string;
  stats: StatData[];
  availableStats: string[];
  onStatTypeChange: (index: number, value: string) => void;
  onStatValueChange: (index: number, value: string) => void;
  onAddStat: () => void;
  onRemoveStat: (index: number) => void;
}

interface ComparisonResultProps {
  derivedStats: Record<string, number>;
  selectedClass: string;
}

// Class selector component
const ClassSelector: React.FC<ClassSelectorProps> = ({ selectedClass, classes, onClassChange }) => (
  <div className="mb-6">
    <Card>
      <CardHeader>
        <CardTitle>Character Class</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {classes.map(className => (
            <div key={className} className="flex items-center space-x-2">
              <Checkbox
                id={className}
                checked={selectedClass === className}
                onCheckedChange={() => onClassChange(className)}
              />
              <label htmlFor={className} className="text-sm font-medium">
                {className}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Stat entry component
const StatEntry: React.FC<StatEntryProps> = ({
  index,
  statType,
  statValue,
  availableStats,
  onStatTypeChange,
  onStatValueChange,
  onRemove
}) => (
  <div className="flex items-center gap-2">
    <Select value={statType} onValueChange={(value) => onStatTypeChange(index, value)}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select stat" />
      </SelectTrigger>
      <SelectContent>
        {availableStats.map(stat => (
          <SelectItem key={stat} value={stat}>{stat}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Input
      type="number"
      value={statValue}
      onChange={(e) => onStatValueChange(index, e.target.value)}
      className="w-24"
      placeholder="Value"
    />
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onRemove(index)}
      className="text-gray-500 hover:text-red-500"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
);

// Item section component
const ItemSection: React.FC<ItemSectionProps> = ({
  title,
  stats,
  availableStats,
  onStatTypeChange,
  onStatValueChange,
  onAddStat,
  onRemoveStat
}) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {stats.map((stat, index) => (
        <StatEntry
          key={index}
          index={index}
          statType={stat.type}
          statValue={stat.value}
          availableStats={availableStats}
          onStatTypeChange={onStatTypeChange}
          onStatValueChange={onStatValueChange}
          onRemove={onRemoveStat}
        />
      ))}
      <Button
        variant="outline"
        onClick={onAddStat}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Stat
      </Button>
    </CardContent>
  </Card>
);

// Comparison result component
const ComparisonResult: React.FC<ComparisonResultProps> = ({ derivedStats, selectedClass }) => {
  const statDifferences = useMemo(() => {
    const differences: Record<string, number> = {};
    
    if (derivedStats) {
      Object.keys(derivedStats).forEach(stat => {
        differences[stat] = derivedStats[stat];
      });
    }

    return differences;
  }, [derivedStats]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{selectedClass} Raw Stat Differences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(statDifferences).map(([stat, difference]) => (
            <div key={stat} className="flex items-center justify-between p-2 hover:bg-gray-50">
              <span className="font-medium">{stat}</span>
              <div className={`flex items-center ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {difference > 0 ? <Plus className="h-4 w-4 mr-1" /> : difference < 0 ? <Minus className="h-4 w-4 mr-1" /> : null}
                {Math.abs(difference).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ItemComparison: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [item1Stats, setItem1Stats] = useState<StatData[]>([{ type: '', value: '' }]);
  const [item2Stats, setItem2Stats] = useState<StatData[]>([{ type: '', value: '' }]);
  const [statsData, setStatsData] = useState<StatsDataRow[]>([]);

  // Load stats data
  useEffect(() => {
    const loadStatsData = async () => {
      try {
        const response = await fetch('/data/lotro-stats.csv');
        const text = await response.text();
        
        const parsed = Papa.parse<StatsDataRow>(text, {
          header: true,
          skipEmptyLines: true
        });
        setStatsData(parsed.data);

        // Set default class
        const classes = Object.keys(parsed.data[0]).slice(2);
        if (classes.length > 0) {
          setSelectedClass(classes[0]);
        }
      } catch (error) {
        console.error('Error loading stats data:', error);
      }
    };
    
    loadStatsData();
  }, []);

  // Get available stats and classes from the CSV
  const availableStats = useMemo(() => {
    if (!statsData.length) return [];
    const primaryStats = [...new Set(statsData.map(row => row['Primary Stat']))];
    const derivedStats = [...new Set(statsData.map(row => row['Derived Stat']))];
    return [...primaryStats, ...derivedStats];
  }, [statsData]);

  const availableClasses = useMemo(() => {
    if (!statsData.length) return [];
    return Object.keys(statsData[0]).slice(2);
  }, [statsData]);

  // Handlers for item 1
  const handleAddStat1 = () => {
    setItem1Stats([...item1Stats, { type: '', value: '' }]);
  };

  const handleRemoveStat1 = (index: number) => {
    setItem1Stats(item1Stats.filter((_, i) => i !== index));
  };

  const handleStatTypeChange1 = (index: number, type: string) => {
    const newStats = [...item1Stats];
    newStats[index].type = type;
    setItem1Stats(newStats);
  };

  const handleStatValueChange1 = (index: number, value: string) => {
    const newStats = [...item1Stats];
    newStats[index].value = value;
    setItem1Stats(newStats);
  };

  // Handlers for item 2
  const handleAddStat2 = () => {
    setItem2Stats([...item2Stats, { type: '', value: '' }]);
  };

  const handleRemoveStat2 = (index: number) => {
    setItem2Stats(item2Stats.filter((_, i) => i !== index));
  };

  const handleStatTypeChange2 = (index: number, type: string) => {
    const newStats = [...item2Stats];
    newStats[index].type = type;
    setItem2Stats(newStats);
  };

  const handleStatValueChange2 = (index: number, value: string) => {
    const newStats = [...item2Stats];
    newStats[index].value = value;
    setItem2Stats(newStats);
  };

  // Calculate derived stats differences with selected class
  const calculateDerivedStats = useMemo(() => {
    if (!statsData.length || !selectedClass) return {};

    const derivedDifferences: Record<string, number> = {};

    item1Stats.forEach(stat1 => {
      const matchingStat2 = item2Stats.find(s => s.type === stat1.type);
      if (matchingStat2 && stat1.type) {
        const statDiff = Number(matchingStat2.value) - Number(stat1.value);
        
        statsData.forEach(row => {
          if (row['Primary Stat'] === stat1.type) {
            const derivedStat = row['Derived Stat'];
            const multiplier = Number(row[selectedClass]) || 0;
            
            if (!derivedDifferences[derivedStat]) {
              derivedDifferences[derivedStat] = 0;
            }
            derivedDifferences[derivedStat] += statDiff * multiplier;
          }
        });
      }
    });

    return derivedDifferences;
  }, [statsData, selectedClass, item1Stats, item2Stats]);

  return (
    <div className="w-full space-y-6">
      <ClassSelector 
        selectedClass={selectedClass}
        classes={availableClasses}
        onClassChange={setSelectedClass}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ItemSection
          title="Item 1"
          stats={item1Stats}
          availableStats={availableStats}
          onStatTypeChange={handleStatTypeChange1}
          onStatValueChange={handleStatValueChange1}
          onAddStat={handleAddStat1}
          onRemoveStat={handleRemoveStat1}
        />
        <ItemSection
          title="Item 2"
          stats={item2Stats}
          availableStats={availableStats}
          onStatTypeChange={handleStatTypeChange2}
          onStatValueChange={handleStatValueChange2}
          onAddStat={handleAddStat2}
          onRemoveStat={handleRemoveStat2}
        />
        <ComparisonResult 
          derivedStats={calculateDerivedStats}
          selectedClass={selectedClass}
        />
      </div>
    </div>
  );
};

export default ItemComparison;