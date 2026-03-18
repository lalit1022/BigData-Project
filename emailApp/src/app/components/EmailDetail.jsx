import { motion } from 'motion/react';
import PropTypes from 'prop-types';
import { ArrowLeft, Star, Trash2, Reply, Forward, MoreVertical, Mail } from 'lucide-react';

const categoryConfig = {
  Primary: {
    color: '#185FA5',
    bgColor: '#E6F1FB',
    textColor: '#185FA5'
  },
  Promotions: {
    color: '#854F0B',
    bgColor: '#FAEEDA',
    textColor: '#854F0B'
  },
  Social: {
    color: '#0F6E56',
    bgColor: '#E1F5EE',
    textColor: '#0F6E56'
  },
  Spam: {
    color: '#A32D2D',
    bgColor: '#FCEBEB',
    textColor: '#A32D2D'
  }
};

export default function EmailDetail({ email, onClose }) {
  const config = categoryConfig[email.category];

  // Generate full email body (mock content based on preview)
  const fullEmailBody = `${email.preview}

Best regards,
${email.from}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900"
    >
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Back to Inbox
        </h2>
      </div>

      {/* Email Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-6">
          {/* Subject */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {email.subject}
          </h1>

          {/* Category + Confidence */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: config.bgColor, color: config.textColor }}
            >
              <Mail size={12} />
              {email.category}
            </span>
            {email.confidence && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  color: email.confidence >= 0.90 ? '#0F6E56'
                       : email.confidence >= 0.75 ? '#185FA5'
                       : '#854F0B',
                  backgroundColor: email.confidence >= 0.90 ? '#E1F5EE'
                                 : email.confidence >= 0.75 ? '#E6F1FB'
                                 : '#FAEEDA'
                }}
              >
                {(email.confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>

          {/* Sender Info */}
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm flex-shrink-0"
              style={{
                backgroundColor: config.bgColor,
                color: config.textColor
              }}
            >
              {email.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {email.from}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    to me
                  </p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {email.time}
                </span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {fullEmailBody}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm hover:shadow">
              <Reply size={16} />
              Reply
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Forward size={16} />
              Forward
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Star size={16} />
              Star
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={16} />
              Delete
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ml-auto">
              <MoreVertical size={16} />
            </button>
          </div>

          {/* Mock Attachments Section (Optional) */}
          {email.category === 'Primary' && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Attachments (Mock)
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">PDF</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      document.pdf
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      2.4 MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

EmailDetail.propTypes = {
  email: PropTypes.shape({
    preview: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    initials: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};