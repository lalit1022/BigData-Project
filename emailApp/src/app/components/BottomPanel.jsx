import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import ClassifySingle from './ClassifySingle';
import BulkUpload from './BulkUpload';

export default function BottomPanel({ isOpen, activeTab, onTabChange, onClose, onClassify, onPipelineStart, onPipelineComplete }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Modal Header with Tabs */}
          <div className="panel-tabs flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={() => onTabChange('single')}
              className={`panel-tab flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'single'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              Classify single email
            </button>
            <button
              onClick={() => onTabChange('bulk')}
              className={`panel-tab flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'bulk'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              Bulk dataset upload
            </button>
            <button
              onClick={onClose}
              className="px-5 py-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close panel"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="overflow-y-auto flex-1">
            {activeTab === 'single' ? (
              <ClassifySingle onClassify={onClassify} />
            ) : (
              <BulkUpload 
                onPipelineStart={onPipelineStart}
                onPipelineComplete={onPipelineComplete}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}