import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import EmailRow from './EmailRow';
import EmptyState from './EmptyState';

const ITEM_HEIGHT = 100; // Approximate height of each email row
const BUFFER_SIZE = 5; // Number of items to render above and below viewport

export default function VirtualEmailList({ emails, activeCategory, onOpenClassify, onOpenUpload, onEmailClick }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const filteredEmails = useMemo(() => 
    activeCategory === 'all'
      ? emails
      : emails.filter((email) => email.category === activeCategory),
    [emails, activeCategory]
  );

  // Update container height
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Scroll to top when category changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [activeCategory]);

  // Handle scroll with throttling for performance
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Calculate visible range with buffer
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    filteredEmails.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );

  const visibleEmails = filteredEmails.slice(startIndex, endIndex);
  const totalHeight = filteredEmails.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  // Render optimized for large datasets
  const shouldUseVirtualization = filteredEmails.length > 50;

  if (filteredEmails.length === 0) {
    return (
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        <EmptyState 
          category={activeCategory}
          onOpenClassify={onOpenClassify}
          onOpenUpload={onOpenUpload}
        />
      </div>
    );
  }

  if (!shouldUseVirtualization) {
    // For small lists, render normally with animations
    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 transition-colors scroll-smooth"
        onScroll={handleScroll}
      >
        <AnimatePresence mode="popLayout">
          {filteredEmails.map((email, index) => (
            <EmailRow key={email.id} email={email} index={index} onEmailClick={onEmailClick} />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // For large lists, use virtualization
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 transition-colors"
      onScroll={handleScroll}
      style={{ 
        scrollBehavior: 'smooth',
        contain: 'strict'
      }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform'
          }}
        >
          {visibleEmails.map((email, idx) => (
            <EmailRow 
              key={email.id} 
              email={email} 
              index={startIndex + idx} 
              onEmailClick={onEmailClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}