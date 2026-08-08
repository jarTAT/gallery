'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig, absoluteUrl } from '@/lib/site-config';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, unknown>;
}

export default function Seo({
  title,
  description,
  keywords,
  canonical,
  image,
  type = 'website',
  jsonLd,
}: SeoProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta('name', 'description', description);
    if (keywords) setMeta('name', 'keywords', keywords);

    const canonicalUrl = canonical ? absoluteUrl(canonical) : `${siteConfig.url}${pathname}`;
    setLinkRel('canonical', canonicalUrl);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', type);
    if (title) {
      setMeta('property', 'og:title', title);
      setMeta('name', 'twitter:title', title);
    }
    if (description) {
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    const imageUrl = image ? absoluteUrl(image) : absoluteUrl(siteConfig.image);
    if (image) {
      setMeta('property', 'og:image', imageUrl);
      setMeta('name', 'twitter:card', 'summary_large_image');
      setMeta('name', 'twitter:image', imageUrl);
    }

    if (jsonLd) {
      const id = 'seo-jsonld';
      document.getElementById(id)?.remove();
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, keywords, canonical, image, pathname, type, jsonLd]);

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

function setLinkRel(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}