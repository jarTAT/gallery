'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Photo, PhotoMediaType } from '@/types';
import Seo from '@/components/Seo';
import { buildKeywords, siteConfig, absoluteUrl } from '@/lib/site-config';

export const runtime = 'edge';

export default function PhotoDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState<{ contact: string; link: string; remaining: number } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    fetchPhoto();
  }, [id]);

  const fetchPhoto = async () => {
    try {
      const response = await fetch(`/api/photos/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setPhoto(result.data);
        const imgs = Array.isArray(result.data.images) ? result.data.images : [];
        setActiveIndex(Math.min(result.data.cover_index || 0, Math.max(imgs.length - 1, 0)));
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch photo:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContact = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setContactLoading(true);
    setContactError('');

    try {
      const response = await fetch(`/api/photos/${id}/contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setContactInfo(result.data);
      } else if (result.requireLogin) {
        router.push('/login');
      } else {
        setContactError(result.error);
      }
    } catch (error) {
      setContactError('获取联系方式失败');
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!photo) {
    return null;
  }

  const images = Array.isArray(photo.images) ? photo.images : [];
  const coverIndex = Math.min(photo.cover_index || 0, Math.max(images.length - 1, 0));
  const mediaType = (index: number): PhotoMediaType => images[index]?.type || 'image';
  const activeIsVideo = mediaType(activeIndex) === 'video';

  const photoTitle = `${photo.name} - 摄影图片 | ${photo.city}${photo.district}`;
  const photoDescription = `${photo.name}，${photo.city}${photo.district}摄影作品，价格 ¥${photo.price}。${photo.tags.length > 0 ? '标签：' + photo.tags.join('、') + '。' : ''}浏览更多高品质摄影图片。`;
  const keywords = buildKeywords([photo.name, photo.city, photo.district, ...photo.tags]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Seo
        title={photoTitle}
        description={photoDescription}
        keywords={keywords}
        canonical={`/photo/${photo.id}`}
        type="product"
        image={`/api/photos/${photo.id}/thumb`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ImageObject',
          name: photo.name,
          description: photoDescription,
          contentUrl: absoluteUrl(`/api/photos/${photo.id}/original?index=${coverIndex}`),
          thumbnailUrl: absoluteUrl(`/api/photos/${photo.id}/thumb?index=${coverIndex}`),
          datePublished: photo.created_at,
          creator: {
            '@type': 'Person',
            name: photo.city ? `${photo.city}${photo.district}` : siteConfig.name,
          },
        }}
      />
      <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        返回首页
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative overflow-hidden bg-gray-100 rounded-xl">
            {activeIsVideo ? (
              <video
                src={`/api/photos/${photo.id}/original?index=${activeIndex}`}
                controls
                playsInline
                preload="metadata"
                className="w-full aspect-square object-contain"
              />
            ) : (
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() => setShowFullImage(true)}
              >
                <img
                  src={`/api/photos/${photo.id}/original?index=${activeIndex}`}
                  alt={`${photo.name}${photo.tags && photo.tags.length > 0 ? ' ' + photo.tags.join(' ') : ''}`}
                  width={1200}
                  height={1200}
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-lg">
                  点击查看原图
                </div>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeIndex === index ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {img?.type === 'video' ? (
                    <video
                      src={`/api/photos/${photo.id}/thumb?index=${index}`}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={`/api/photos/${photo.id}/thumb?index=${index}`}
                      alt={`${photo.name} ${index + 1}${photo.tags && photo.tags.length > 0 ? ' ' + photo.tags.join(' ') : ''}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {img?.type === 'video' && (
                    <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-black/60 text-white text-[10px] rounded-tl-lg">
                      ▶ 视频
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{photo.name}</h1>
            <p className="mt-2 text-4xl font-bold text-primary-600">¥{photo.price}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{photo.city} {photo.district}</span>
            </div>

            {photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">联系方式</h3>
            
            {contactInfo ? (
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">联系方式</p>
                  <p className="font-medium text-gray-900">{contactInfo.contact}</p>
                </div>
                {contactInfo.link && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">链接</p>
                    <a 
                      href={contactInfo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700 break-all"
                    >
                      {contactInfo.link}
                    </a>
                  </div>
                )}
                {user && !user.is_member && (
                  <p className="text-sm text-gray-500">
                    今日剩余查看次数: {contactInfo.remaining}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={handleViewContact}
                  disabled={contactLoading}
                  className="w-full btn-primary py-3"
                >
                  {contactLoading ? '加载中...' : '点击查看'}
                </button>
                {contactError && (
                  <p className="mt-2 text-sm text-red-600">{contactError}</p>
                )}
                {!user && (
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    登录后可查看联系方式
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFullImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={() => setShowFullImage(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
                aria-label="上一张"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((prev) => (prev + 1) % images.length);
                }}
                aria-label="下一张"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {activeIsVideo ? (
            <video
              src={`/api/photos/${photo.id}/original?index=${activeIndex}`}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full"
            />
          ) : (
            <img
              src={`/api/photos/${photo.id}/original?index=${activeIndex}`}
              alt={`${photo.name}${photo.tags && photo.tags.length > 0 ? ' ' + photo.tags.join(' ') : ''}`}
              width={1920}
              height={1920}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <div className="px-4 py-2 bg-black/50 text-white text-sm rounded-full">
                {activeIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
