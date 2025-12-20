import React from 'react';
import { motion } from 'motion/react';

const shimmer = {
  hidden: { opacity: 0.3 },
  visible: { 
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse' as const,
      duration: 1.5,
      ease: 'easeInOut'
    }
  }
};

export function SkeletonLoader() {
  return (
    <div className="space-y-4 p-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial="hidden"
            animate="visible"
            variants={shimmer}
            className="bg-white rounded-lg shadow p-4"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-3/4"></div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={shimmer}
        className="bg-white rounded-lg shadow p-6 space-y-4"
      >
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 mb-4"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
            </div>
            <div className="w-24 h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={shimmer}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-4/6"></div>
      </div>
    </motion.div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={shimmer}
        className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-4"
      />
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="flex gap-4 p-3 border border-gray-200 rounded"
        >
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/5"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/6"></div>
        </motion.div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
            <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded"></div>
          </div>
          <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3"></div>
        </motion.div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="flex items-center gap-3 p-4 bg-white rounded-lg shadow"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
        </motion.div>
      ))}
    </div>
  );
}