import { motion } from 'motion/react';

export default function EmailListSkeleton({ count = 10 }) {
  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="grid grid-cols-[48px_1fr_auto] sm:grid-cols-[48px_1fr_auto] gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800"
        >
          {/* Avatar Skeleton */}
          <div className="flex items-start pt-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>

          {/* Email Content Skeleton */}
          <div className="min-w-0 flex flex-col justify-center space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2" />
          </div>

          {/* Time and Badge Skeleton */}
          <div className="flex flex-col items-end justify-center gap-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-16" />
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse w-20" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
