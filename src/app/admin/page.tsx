'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';

interface Stats {
  totalPhotos: number;
  totalAlbums: number;
  totalUsers: number;
  priceRanges: Record<string, number>;
  cityStats: Record<string, number>;
  tagStats: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-8 text-gray-500">加载失败</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">仪表盘</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <span className="text-2xl">🖼️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">照片总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">用户总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">价格分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.priceRanges).map(([range, count]) => (
              <div key={range} className="flex items-center">
                <span className="w-24 text-sm text-gray-600">{range}</span>
                <div className="flex-1 mx-4">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500"
                      style={{ width: `${(count / stats.totalPhotos) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门城市</h3>
          <div className="space-y-3">
            {Object.entries(stats.cityStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{city}</span>
                  <span className="text-sm font-medium text-gray-900">{count} 张</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.tagStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 20)
              .map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag} ({count})
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
