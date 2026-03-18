import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const config = {
  error:   { icon: AlertCircle,   colors: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' },
  success: { icon: CheckCircle2,  colors: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400' },
  info:    { icon: Info,          colors: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' },
};

export default function NotificationToast({ message, type = 'error', onClose, duration = 4000 }) {
  const { icon: Icon, colors } = config[type] || config.error;

  // Auto-dismiss after duration
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full ${colors}`}
        >
          <Icon size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium flex-1">{message}</p>
          <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}