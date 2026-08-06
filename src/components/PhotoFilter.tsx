'use client';

import { useState } from 'react';

interface PhotoFilterProps {
  onFilter: (filters: FilterState) => void;
  initialFilters?: FilterState;
  cities?: string[];
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

export default function PhotoFilter({ onFilter, initialFilters, cities = [] }: PhotoFilterProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      search: '',
      min_price: null,
      max_price: null,
      city: '',
      tags: [],
    }
  );

  const [priceIndex, setPriceIndex] = useState(0);

  const handlePriceChange = (value: string) => {
    const index = parseInt(value, 10);
    setPriceIndex(index);
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
    const reset: FilterState = {
      search: '',
      min_price: null,
      max_price: null,
      city: '',
      tags: [],
    };
    setFilters(reset);
    setPriceIndex(0);
    onFilter(reset);
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
            placeholder="名称、标签、城市等，可用空格或逗号分隔多个关键字"
            className="input"
          />
        </div>
        
        <div>
          <label className="label">价格区间</label>
          <select
            value={priceIndex}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="input"
          >
            {PRICE_RANGES.map((range, index) => (
              <option key={index} value={index}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="label">城市</label>
          <select
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            className="input"
          >
            <option value="">全部城市</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
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