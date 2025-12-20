import { StatCardData } from '../../lib/types';
import { motion } from 'motion/react';

interface StatCardProps {
  stat: StatCardData;
  inverseChangeLogic?: boolean;
  index?: number;
}

export function StatCard({ stat, inverseChangeLogic = false, index = 0 }: StatCardProps) {
  const Icon = stat.icon;
  const isPositive = stat.change.startsWith('+');
  
  // For debt-related stats, negative change is good
  const changeColor = inverseChangeLogic 
    ? (isPositive ? 'text-red-600' : 'text-green-600')
    : (isPositive ? 'text-green-600' : 'text-red-600');

  // Determine if breakdown shows days/cycles or counts
  const isCycleBreakdown = stat.label.includes('Sales Cycle');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`${stat.color} rounded-xl p-6 shadow-lg text-white cursor-default transform transition-shadow hover:shadow-xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
          className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-lg flex items-center justify-center"
        >
          <Icon className="text-white" size={24} aria-hidden="true" />
        </motion.div>
        <motion.span 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
          className="text-sm bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-white"
        >
          {stat.change}
        </motion.span>
      </div>
      <div>
        <p className="text-white/80 text-sm">{stat.label}</p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
          className="text-2xl mt-1"
        >
          {stat.value}
        </motion.p>
        
        {/* Performance Category Breakdown */}
        {stat.breakdown && (
          <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
            {stat.breakdown.star > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/80">Star Performer:</span>
                <span className="text-sm">{stat.breakdown.star}{isCycleBreakdown ? ' days' : ''}</span>
              </div>
            )}
            {stat.breakdown.excellent > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/80">Excellent:</span>
                <span className="text-sm">{stat.breakdown.excellent}{isCycleBreakdown ? ' days' : ''}</span>
              </div>
            )}
            {stat.breakdown.good > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/80">Good:</span>
                <span className="text-sm">{stat.breakdown.good}{isCycleBreakdown ? ' days' : ''}</span>
              </div>
            )}
            {stat.breakdown.average > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/80">Average:</span>
                <span className="text-sm">{stat.breakdown.average}{isCycleBreakdown ? ' days' : ''}</span>
              </div>
            )}
            {stat.breakdown.needsAttention > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/80">Needs Attention:</span>
                <span className="text-sm">{stat.breakdown.needsAttention}{isCycleBreakdown ? ' days' : ''}</span>
              </div>
            )}
          </div>
        )}
        
        {/* AI Analysis */}
        {stat.analysis && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-white/80 leading-relaxed">{stat.analysis}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}