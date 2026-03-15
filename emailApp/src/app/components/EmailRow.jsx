import { motion } from 'motion/react';
import { memo } from 'react';
import PropTypes from 'prop-types';

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

function EmailRow({ email, index, onEmailClick }) {
  const config = categoryConfig[email.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      layout
      onClick={() => onEmailClick && onEmailClick(email)}
      className={`email-row grid grid-cols-[48px_1fr_auto] sm:grid-cols-[48px_1fr_auto] gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
        email.unread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
      }`}
    >
      {/* Avatar */}
      <div className="flex items-start pt-1">
        <div
          className="avatar w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm"
          style={{
            backgroundColor: config.bgColor,
            color: config.textColor
          }}
        >
          {email.initials}
        </div>
      </div>

      {/* Email Content */}
      <div className="min-w-0 flex flex-col justify-center">
        <div className={`sender text-xs sm:text-sm mb-1 ${
          email.unread
            ? 'font-semibold text-gray-900 dark:text-gray-100'
            : 'font-medium text-gray-700 dark:text-gray-300'
        }`}>
          {email.from}
        </div>
        <div className={`subject text-sm sm:text-base mb-1 truncate ${
          email.unread
            ? 'font-medium text-gray-900 dark:text-gray-100'
            : 'text-gray-800 dark:text-gray-200'
        }`}>
          {email.subject}
        </div>
        <div className="preview text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
          {email.preview}
        </div>
      </div>

      {/* Time and Category Badge */}
      <div className="flex flex-col items-end justify-center gap-2 text-right min-w-[80px] sm:min-w-[100px]">
        <div className="time text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {email.time}
        </div>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.03 + 0.2, type: 'spring', stiffness: 200 }}
          className="cat-badge text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap shadow-sm"
          style={{
            backgroundColor: config.bgColor,
            color: config.textColor
          }}
        >
          {email.category}
        </motion.span>
        {email.unread && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-blue-500"
          />
        )}
      </div>
    </motion.div>
  );
}

EmailRow.propTypes = {
  email: PropTypes.shape({
    id: PropTypes.number.isRequired,
    from: PropTypes.string.isRequired,
    initials: PropTypes.string.isRequired,
    category: PropTypes.oneOf(['Primary', 'Promotions', 'Social', 'Spam']).isRequired,
    subject: PropTypes.string.isRequired,
    preview: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    unread: PropTypes.bool
  }).isRequired,
  index: PropTypes.number.isRequired,
  onEmailClick: PropTypes.func
};

export default memo(EmailRow);
