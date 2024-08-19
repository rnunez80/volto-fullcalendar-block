import React, { Suspense } from 'react';

// Lazy load the components using different internal names
const LazyFullCalendarBlockEdit = React.lazy(() => import('./manage/Blocks/FullCalendar/Edit'));
const LazyFullCalendarBlockView = React.lazy(() => import('./manage/Blocks/FullCalendar/View'));
const LazyFullCalendarListing = React.lazy(() => import('./manage/Blocks/Listing/FullCalendar'));

// Create fallback component for Suspense
const LoadingFallback = () => (
  <div>
    <p>Loading...</p>
  </div>
);

// Export the components with the original names, wrapped in Suspense
export const FullCalendarBlockEdit = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyFullCalendarBlockEdit {...props} />
  </Suspense>
);

export const FullCalendarBlockView = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyFullCalendarBlockView {...props} />
  </Suspense>
);

export const FullCalendarListing = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyFullCalendarListing {...props} />
  </Suspense>
);
