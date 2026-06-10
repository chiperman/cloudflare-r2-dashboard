'use client';

import { useState, useEffect } from 'react';

/**
 * A React hook that tracks the state of a CSS media query.
 * @param query - The media query string to watch.
 * @returns `true` if the media query matches, otherwise `false`.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * if (isMobile) {
 *   // Render mobile view
 * } else {
 *   // Render desktop view
 * }
 */
export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false);

  useEffect(() => {
    // Check on initial mount
    const mediaQueryList = window.matchMedia(query);
    const timer = window.setTimeout(() => {
      setValue(mediaQueryList.matches);
    }, 0);

    // Define the listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setValue(event.matches);
    };

    // Add listener for changes
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup listener on unmount
    return () => {
      window.clearTimeout(timer);
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return value;
}
