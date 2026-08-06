'use client';

import { useState } from 'react';

interface PhotoFilterProps {
  onFilter: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  search: string;
  min_price: number | null;
  max_price: number | null;
  city: string;
  tags: string[];
}

const PRICE_RANGES = [
  { label: '不限', min: null, max: null },
  { label: '0-500', min: 0, max: 500 },
  { label: '500-1000', min: 500, max: 1000 },
  { label: '1000以上', min: 1000, max: null },
];

export default function PhotoFilter({ onFilter, initialFilters }: PhotoFilterProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      search: '',
      min_price: null,
      max_price: null,
      city: '',
      tags: [],
    }
  );

  const [selectedPriceRange, setSelectedPriceRange] = useState(0);

  const handlePriceRangeSelect = (index: number) => {
    setSelectedPriceRange(index);
    const range = PRICE_RANGES[index];
    setFilters(prev => ({
      ...prev,
      min_price: range.min,
      max_price: range.max,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      min_price: null,
      max_price: null,
      city: '',
      tags: [],
    });
    setSelectedPriceRange(0);
    onFilter({
      search: '',
      min_price: null,
      max_price: null,
      city: '',
      tags: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="label">搜索</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="名称、标签、城市..."
            className="input"
          />
        </div>
        
        <div>
          <label className="label">价格区间</label>
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((range, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePriceRangeSelect(index)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedPriceRange === index
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="label">城市</label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            placeholder="输入城市名称..."
            className="input"
          />
        </div>
        
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex-1">
            筛选
          </button>
          <button type="button" onClick={handleReset} className="btn-secondary">
            重置
          </button>
        </div>
      </div>
    </form>
  );
}
