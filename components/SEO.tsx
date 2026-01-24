import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
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
    const siteTitle = 'Escapes y Más';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const baseUrl = 'https://escapesymas.com';
    const fullCanonical = canonical ? `${baseUrl}${canonical}` : baseUrl;

    return (
        <Helmet>
            {/* Basic metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || 'Tienda especializada en escapes y recambios para moto.'} />
            <link rel="canonical" href={fullCanonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || 'Tienda especializada en escapes y recambios para moto.'} />
            <meta property="og:url" content={fullCanonical} />
            {image && <meta property="og:image" content={image} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || 'Tienda especializada en escapes y recambios para moto.'} />
            {image && <meta name="twitter:image" content={image} />}
        </Helmet>
    );
};
