import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    canonical?: string;
    image?: string;
    type?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    canonical,
    image,
    type = 'website'
}) => {
    const siteName = 'Escapes y Más';
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
    const baseUrl = 'https://escapesymas.com';
    const fullCanonical = canonical ? `${baseUrl}${canonical}` : undefined;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {fullCanonical && <link rel="canonical" href={fullCanonical} />}

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            {description && <meta property="og:description" content={description} />}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:type" content={type} />
            {fullCanonical && <meta property="og:url" content={fullCanonical} />}
            {image && <meta property="og:image" content={image} />}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            {description && <meta name="twitter:description" content={description} />}
            {image && <meta name="twitter:image" content={image} />}
        </Helmet>
    );
};
