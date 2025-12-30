'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FilterPanel({ filters, onChange, options }) {
  const handleFilterChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-4">
      {Object.keys(options).map((key) => (
        <Select
          key={key}
          value={filters[key] || ''}
          onValueChange={(value) => handleFilterChange(key, value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={`Select ${key}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All {key}s</SelectItem>
            {options[key].map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}