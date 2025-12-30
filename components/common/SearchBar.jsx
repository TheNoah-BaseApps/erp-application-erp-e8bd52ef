'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from '@/lib/utils';

export default function SearchBar({ placeholder, value, onChange }) {
  const [searchTerm, setSearchTerm] = useState(value || '');

  useEffect(() => {
    const debouncedSearch = debounce(() => {
      onChange(searchTerm);
    }, 300);

    debouncedSearch();
  }, [searchTerm]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder || 'Search...'}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );
}