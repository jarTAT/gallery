'use client';

import { useState, useEffect } from 'react';
import PhotoCard from '@/components/PhotoCard';
import PhotoFilter, { FilterState } from '@/components/PhotoFilter';
import { Photo, PaginatedResponse } from '@/types';

export default function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    min_price: null,
    max_price: null,
    city: '',
    tags: [],
  });

  const fetchPhotos = async (pageNum: number, currentFilters: FilterState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '20');
      
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.min_price !== null) params.set('min_price', currentFilters.min_price.toString());
      if (currentFilters.max_price !== null) params.set('max_price', currentFilters.max_price.toString());
      if (currentFilters.city) params.set('city', currentFilters.city);
      if (currentFilters.tags.length > 0) params.set('tags', currentFilters.tags.join(','));
      
      const response = await fetch(`/api/photos?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        const data: PaginatedResponse<Photo> = result.data;
        if (pageNum === 1) {
          setPhotos(data.data);
        } else {
          setPhotos(prev => [...prev, ...data.data]);
        }
        setHasMore(data.has_more);
        setTotal(data.total);
        if (pageNum === 1 && Array.isArray(result.cities)) {
          setCities(result.cities);
        }
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos(1, filters);
    setPage(1);
  }, [filters]);

  const handleFilter = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPhotos(nextPage, filters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">照片库</h1>
        <p className="text-gray-600">
          共 {total} 张照片
        </p>
      </div>
      
      <PhotoFilter onFilter={handleFilter} initialFilters={filters} cities={cities} />
      
      {photos.length === 0 && !loading ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">暂无照片</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map(photo => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
      
      {loading && photos.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      )}
    </div>
  );
}
