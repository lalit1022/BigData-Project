import { motion } from 'motion/react';
import { Mail, Tag, Sparkles, Zap, ShieldAlert, FileUp } from 'lucide-react';

const categoryEmptyStates = {
  all: {
    icon: Mail,
    title: 'No emails yet',
    description: 'Upload a dataset or classify individual emails to get started',
    color: '#888780',
    bgColor: '#F1EFE8'
  },
  Primary: {
    icon: Tag,
    title: 'No primary emails',
    description: 'Important work and personal emails will appear here',
    color: '#185FA5',
    bgColor: '#E6F1FB'
  },
  Promotions: {
    icon: Sparkles,
    title: 'No promotional emails',
    description: 'Deals, offers, and marketing emails will appear here',
    color: '#854F0B',
    bgColor: '#FAEEDA'
  },
  Social: {
    icon: Zap,
    title: 'No social emails',
    description: 'Social network notifications and updates will appear here',
    color: '#0F6E56',
    bgColor: '#E1F5EE'
  },
  Spam: {
    icon: ShieldAlert,
    title: 'No spam detected',
    description: 'Suspicious and unwanted emails will be filtered here',
    color: '#A32D2D',
    bgColor: '#FCEBEB'
  }
};

export default function EmptyState({ category = 'all', onOpenClassify, onOpenUpload }) {
  const config = categoryEmptyStates[category] || categoryEmptyStates.all;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-6 p-6 rounded-full"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon size={64} style={{ color: config.color }} />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
      >
        {config.title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-md"
      >
        {config.description}
      </motion.p>

      {/* Action Buttons */}
      {category === 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={onOpenClassify}
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 font-medium"
          >
            <Mail size={18} />
            Classify one email
          </button>
          <button
            onClick={onOpenUpload}
            className="px-6 py-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 font-medium"
          >
            <FileUp size={18} />
            Upload dataset
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
