import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Search...' 
}: SearchInputProps) {
  return (
    <div className="flex-1 relative">
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors" 
        size={20}
        aria-hidden="true" 
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
        aria-label="Search"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}