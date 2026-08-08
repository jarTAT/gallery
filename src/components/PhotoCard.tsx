'use client';

import Link from 'next/link';
import MediaImage from '@/components/MediaImage';
import { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const images = Array.isArray(photo.images) ? photo.images : [];
  const firstImage = images.findIndex((i) => i?.type !== 'video');
  const coverIndex = firstImage >= 0 ? firstImage : (photo.cover_index || 0);
  const hasVideo = images.some((i) => i?.type === 'video');

  return (
    <Link href={`/photo/${photo.id}`} className="card group">
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <MediaImage
          src={`/api/photos/${photo.id}/thumb?index=${coverIndex}`}
          type={images[coverIndex]?.type}
          alt={`${photo.name}${photo.tags && photo.tags.length > 0 ? ' ' + photo.tags.join(' ') : ''}`}
          width={480}
          height={480}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          preload="metadata"
          muted
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {photo.is_pinned && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-lg shadow">
              ★ 置顶
            </span>
          )}
          <span className="px-2 py-1 bg-accent-500 text-white text-xs font-medium rounded-lg shadow">
            ¥{photo.price}
          </span>
        </div>
        {Array.isArray(photo.images) && photo.images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {photo.images.length}
          </div>
        )}
        {hasVideo && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-accent-500/90 text-white text-xs rounded-lg">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
            视频
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm truncate">{photo.name}</h3>
        <div className="mt-1.5 flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs">{photo.city} {photo.district}</span>
        </div>
        {photo.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {photo.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {photo.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{photo.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
