import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoWrapperProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  children: React.ReactNode;
}

const SeoWrapper: React.FC<SeoWrapperProps> = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = '/images/Dreamcasa3-removebg-preview.png',
  children
}) => {
  const fullTitle = `${title} | DreamCasa AI`;
  
  return (
    <>
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content={ogType} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "DreamCasa AI",
            "description": "Transform your spaces with artificial intelligence",
            "url": window.location.origin,
            "applicationCategory": "DesignApplication"
          })}
        </script>
      </Helmet>
      {children}
    </>
  );
};

export default SeoWrapper;
