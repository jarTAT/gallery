'use client';

import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export default function Seo({ title, description, keywords }: SeoProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      setMeta('name', 'description', description);
    }
    if (keywords) {
      setMeta('name', 'keywords', keywords);
    }
  }, [title, description, keywords]);

  return null;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let meta = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}