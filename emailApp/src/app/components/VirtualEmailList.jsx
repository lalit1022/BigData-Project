import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import EmailRow from "./EmailRow";
import EmptyState from "./EmptyState";

const ITEM_HEIGHT = 88;
const BUFFER_SIZE = 8;

export default function VirtualEmailList({
  emails,
  activeCategory,
  onOpenClassify,
  onOpenUpload,
  onEmailClick,
  savedScrollTop,
  restoreTick,
}) {
  const containerRef = useRef(null);
  const scrollTopRef = useRef(savedScrollTop || 0);
  const rafRef = useRef(null);
  const [renderTick, setRenderTick] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const filteredEmails = useMemo(
    () =>
      activeCategory === "all"
        ? emails
        : emails.filter((e) => e.category === activeCategory),
    [emails, activeCategory],
  );

  // Measure container height
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Restore saved scroll position when returning from email detail
  useEffect(() => {
    if (!restoreTick) return;
    if (containerRef.current) {
      const nextScrollTop = Number.isFinite(savedScrollTop)
        ? savedScrollTop
        : 0;
      const shouldSmoothToTop = nextScrollTop === 0;
      if (typeof containerRef.current.scrollTo === "function") {
        containerRef.current.scrollTo({
          top: nextScrollTop,
          behavior: shouldSmoothToTop ? "smooth" : "auto",
        });
      } else {
        containerRef.current.scrollTop = nextScrollTop;
      }
      scrollTopRef.current = nextScrollTop;
      setRenderTick((t) => t + 1);
    }
  }, [restoreTick, savedScrollTop]);

  // Scroll to top when category changes (tab click)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      scrollTopRef.current = 0;
      setRenderTick((t) => t + 1);
    }
  }, [activeCategory]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Throttled scroll
  const handleScroll = useCallback((e) => {
    const top = e.currentTarget.scrollTop;
    scrollTopRef.current = top;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setRenderTick((t) => t + 1);
    });
  }, []);

  const totalHeight = filteredEmails.length * ITEM_HEIGHT;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTopRef.current / ITEM_HEIGHT) - BUFFER_SIZE,
  );
  const endIndex = Math.min(
    filteredEmails.length,
    Math.ceil((scrollTopRef.current + containerHeight) / ITEM_HEIGHT) +
      BUFFER_SIZE,
  );
  const visibleEmails = filteredEmails.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

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

  if (filteredEmails.length <= 50) {
    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 transition-colors"
        onScroll={handleScroll}
      >
        {filteredEmails.map((email, index) => (
          <EmailRow
            key={email.id ?? index}
            email={email}
            index={index}
            onEmailClick={(email) => onEmailClick(email, scrollTopRef.current)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 transition-colors"
      onScroll={handleScroll}
      style={{ contain: "strict" }}
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleEmails.map((email, idx) => (
            <EmailRow
              key={email.id ?? startIndex + idx}
              email={email}
              index={startIndex + idx}
              onEmailClick={(email) =>
                onEmailClick(email, scrollTopRef.current)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
