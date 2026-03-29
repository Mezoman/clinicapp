import { useEffect } from 'react';

/**
 * Hook to dynamically preload an image by injecting a <link rel="preload"> tag into the <head>.
 * This ensures the image is preloaded only when the component using this hook is mounted.
 * 
 * @param src The URL of the image to preload.
 */
export function usePreloadImage(src: string) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);

    // Cleanup: remove the link tag when the component is unmounted
    return () => {
      link.remove();
    };
  }, [src]);
}
