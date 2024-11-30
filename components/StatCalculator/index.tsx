"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Papa from 'papaparse';

// Type definitions
interface StatsDataRow {
  'Primary Stat': string;
  'Derived Stat': string;
  [className: string]: string | number;
}

interface ClassToggleProps {
  className: string;
  checked: boolean;
  onChange: () => void;
}

interface TableHeaderProps {
  className: string;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

interface StatSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

interface DerivativeValues {
  derivedStat: string;
  values: Record<string, string>;
}

// Separate pure components for better performance
const ClassToggle: React.FC<ClassToggleProps> = ({ className, checked, onChange }) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={className}
      checked={checked}
      onCheckedChange={onChange}
    />
    <label htmlFor={className} className="text-sm font-medium">
      {className}
    </label>
  </div>
);
ClassToggle.displayName = 'ClassToggle';

const TableHeader: React.FC<TableHeaderProps> = ({ className, onDragStart, onDragOver, onDragEnd }) => (
  <th 
    className="p-2 border text-center cursor-move relative group"
    draggable
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDragEnd={onDragEnd}
  >
    <div className="flex items-center justify-center gap-2">
      <div className="flex flex-col items-center justify-center w-4">
        <div className="flex gap-0.5 mb-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      {className}
    </div>
    <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 transition-colors duration-200"></div>
  </th>
);
TableHeader.displayName = 'TableHeader';

const StatSelector: React.FC<StatSelectorProps> = ({ value, onChange, options }) => (
  <div className="w-64">
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select primary stat" />
      </SelectTrigger>
      <SelectContent>
        {options.map(stat => (
          <SelectItem key={stat} value={stat}>{stat}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
StatSelector.displayName = 'StatSelector';

const StatCalculator: React.FC = () => {
  // State
  const [data, setData] = useState<StatsDataRow[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Record<string, boolean>>({});
  const [selectedStat, setSelectedStat] = useState<string>('');
  const [statValue, setStatValue] = useState<string>('');
  const [classOrder, setClassOrder] = useState<string[]>([]);
  const [draggedClass, setDraggedClass] = useState<string | null>(null);

  // Memoized derived values with selector pattern
  const primaryStats = useMemo(() => 
    [...new Set(data.map(row => row['Primary Stat']))],
    [data]
  );

  const derivedStats = useMemo(() => 
    [...new Set(data.map(row => row['Derived Stat']))],
    [data]
  );

  // Optimized calculation with caching
  const calculateDerivatives = useCallback(() => {
    if (!selectedStat || !statValue) return [];
    
    const cache = new Map<string, StatsDataRow>();
    const numericValue = parseFloat(statValue);
    
    return derivedStats.map(derivedStat => {
      const cacheKey = `${selectedStat}-${derivedStat}`;
      let relevantRow = cache.get(cacheKey);
      
      if (!relevantRow) {
        relevantRow = data.find(row => 
          row['Primary Stat'] === selectedStat && 
          row['Derived Stat'] === derivedStat
        );
        if (relevantRow) {
          cache.set(cacheKey, relevantRow);
        }
      }

      if (!relevantRow) return null;

      const classValues: Record<string, string> = {};
      classOrder.forEach(className => {
        if (selectedClasses[className]) {
          const multiplier = Number(relevantRow![className]) || 0;
          classValues[className] = (multiplier * numericValue).toFixed(2);
        }
      });

      return { derivedStat, values: classValues };
    }).filter((item): item is DerivativeValues => item !== null);
  }, [selectedStat, statValue, data, classOrder, selectedClasses, derivedStats]);

  // Memoized derivatives
  const derivatives = useMemo(() => 
    calculateDerivatives(),
    [calculateDerivatives]
  );

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/lotro-stats.csv');
        const text = await response.text();
        
        const parsedData = Papa.parse<StatsDataRow>(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        }).data;
        
        const classList = Object.keys(parsedData[0]).slice(2);
        
        setData(parsedData);
        setClassOrder(classList);
        setSelectedClasses(
          classList.reduce<Record<string, boolean>>((acc, className) => ({
            ...acc,
            [className]: true
          }), {})
        );
        setSelectedStat(parsedData[0]['Primary Stat']);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    };
  
    fetchData();
  }, []);

  // Optimized drag handlers
  const handleDragStart = useCallback((className: string) => {
    setDraggedClass(className);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetClass: string) => {
    e.preventDefault();
    if (!draggedClass || draggedClass === targetClass) return;

    setClassOrder(currentOrder => {
      const newOrder = [...currentOrder];
      const draggedIndex = newOrder.indexOf(draggedClass);
      const targetIndex = newOrder.indexOf(targetClass);

      if (draggedIndex === -1 || targetIndex === -1) return currentOrder;

      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedClass);
      return newOrder;
    });
  }, [draggedClass]);

  return (
    <div className="w-full min-w-0 flex">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>LOTRO Stat Derivatives Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-2">
                <Checkbox
                  id="toggle-all"
                  checked={Object.values(selectedClasses).every(Boolean)}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setSelectedClasses(
                        classOrder.reduce<Record<string, boolean>>((acc, className) => ({
                          ...acc,
                          [className]: checked
                        }), {})
                      );
                    }
                  }}
                />
                <label htmlFor="toggle-all" className="text-sm font-medium">
                  Toggle All Classes
                </label>
              </div>
              <div className="flex flex-wrap gap-4 p-4 bg-gray-100 rounded-lg">
                {classOrder.map(className => (
                  <ClassToggle
                    key={className}
                    className={className}
                    checked={selectedClasses[className]}
                    onChange={() => setSelectedClasses(prev => ({
                      ...prev,
                      [className]: !prev[className]
                    }))}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <StatSelector 
                value={selectedStat}
                onChange={setSelectedStat}
                options={primaryStats}
              />
              <Input
                type="number"
                placeholder="Enter stat value"
                value={statValue}
                onChange={(e) => setStatValue(e.target.value)}
                className="w-32"
              />
            </div>

            <div className="w-full overflow-x-auto rounded-lg">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border text-left sticky left-0 bg-gray-100 z-10">
                          Derived Stat
                        </th>
                        {classOrder.map(className => 
                          selectedClasses[className] && (
                            <TableHeader
                              key={className}
                              className={className}
                              onDragStart={() => handleDragStart(className)}
                              onDragOver={(e) => handleDragOver(e, className)}
                              onDragEnd={() => setDraggedClass(null)}
                            />
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {derivatives.map(({ derivedStat, values }) => (
                        <tr key={derivedStat} className="hover:bg-gray-50">
                          <td className="p-2 border font-medium sticky left-0 bg-white z-10">
                            {derivedStat}
                          </td>
                          {classOrder.map(className => 
                            selectedClasses[className] && (
                              <td 
                                key={className} 
                                className="p-2 border text-center whitespace-nowrap"
                                onDragOver={(e) => handleDragOver(e, className)}
                              >
                                {values[className]}
                              </td>
                            )
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCalculator;