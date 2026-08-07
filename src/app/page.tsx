'use client';

import { useState, useEffect } from 'react';
import PhotoCard from '@/components/PhotoCard';
import PhotoFilter, { FilterState } from '@/components/PhotoFilter';
import { Photo, PaginatedResponse } from '@/types';
import Seo from '@/components/Seo';
import { siteConfig, buildKeywords } from '@/lib/site-config';

const PAGE_SIZE = 12;

export default function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      params.set('limit', PAGE_SIZE.toString());
      
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.min_price !== null) params.set('min_price', currentFilters.min_price.toString());
      if (currentFilters.max_price !== null) params.set('max_price', currentFilters.max_price.toString());
      if (currentFilters.city) params.set('city', currentFilters.city);
      if (currentFilters.tags.length > 0) params.set('tags', currentFilters.tags.join(','));
      
      const response = await fetch(`/api/photos?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        const data: PaginatedResponse<Photo> = result.data;
        setPhotos(data.data);
        setTotal(data.total);
        setTotalPages(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
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

  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setPage(pageNum);
    fetchPhotos(pageNum, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo
        title={siteConfig.title}
        description={siteConfig.description}
        keywords={buildKeywords()}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">照片库</h1>
        <p className="text-gray-600">
          上榜老师 {total} 人，以下内容来自网上公开信息收集整理，尽量保证真实；部分已验证。本站不对最终结果负责；请自行联系，谨慎出击。
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
          
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {getPageNumbers().map((p, index) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-400 select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    disabled={loading}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      p === page
                        ? 'bg-primary-600 text-white font-medium'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
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
