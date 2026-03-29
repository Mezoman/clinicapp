import { useEffect, useCallback } from 'react';

/**
 * Custom hook to trap focus within a container and handle Escape key.
 * @param ref Ref to the container element
 * @param isOpen Boolean indicating if the trap should be active
 * @param onClose Callback to trigger on Escape key
 */
export const useFocusTrap = (
    ref: React.RefObject<HTMLElement | null>,
    isOpen: boolean,
    onClose: () => void
) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen || !ref.current) return;

        // Escape handling: Do not fire if a dropdown or select is open inside
        if (e.key === 'Escape') {
            const target = e.target as HTMLElement;
            const isDropdownOpen = !!target.closest('select') ||
                target.getAttribute('aria-expanded') === 'true' ||
                !!target.closest('[role="listbox"]');

            if (!isDropdownOpen) {
                onClose();
            }
            return;
        }

        if (e.key === 'Tab') {
            const activeElement = document.activeElement as HTMLElement;
            const isTextInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

            const focusableElements = ref.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (isTextInput) {
                if (e.shiftKey && activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
                return;
            }

            if (e.shiftKey) { // Shift + Tab
                if (activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }, [isOpen, onClose, ref]);

    useEffect(() => {
        if (isOpen && ref.current) {
            // Delay focus slightly to ensure modal is rendered and visible
            const timeoutId = setTimeout(() => {
                const focusableElements = ref.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements && focusableElements.length > 0) {
                    (focusableElements[0] as HTMLElement).focus();
                }
            }, 50);

            document.addEventListener('keydown', handleKeyDown);
            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, handleKeyDown, ref]);
};
