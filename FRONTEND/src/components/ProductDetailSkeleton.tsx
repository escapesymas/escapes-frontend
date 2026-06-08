'use client';

import React from 'react';

export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in font-sans">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-3 bg-tech-carbon rounded w-48 mb-6 animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-card-border rounded-sm p-6 aspect-square animate-pulse">
            <div className="w-full h-full bg-tech-carbon rounded" />
          </div>

          <div className="space-y-4">
            <div className="h-6 bg-tech-carbon rounded w-3/4 animate-pulse" />
            <div className="h-8 bg-tech-carbon rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-tech-carbon rounded w-1/2 animate-pulse" />
            <div className="space-y-2 pt-4">
              <div className="h-3 bg-tech-carbon rounded w-full animate-pulse" />
              <div className="h-3 bg-tech-carbon rounded w-full animate-pulse" />
              <div className="h-3 bg-tech-carbon rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
