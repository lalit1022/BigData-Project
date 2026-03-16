import { memo } from 'react';
import PropTypes from 'prop-types';

const categoryConfig = {
  Primary:    { color: '#185FA5', bgColor: '#E6F1FB', textColor: '#185FA5' },
  Promotions: { color: '#854F0B', bgColor: '#FAEEDA', textColor: '#854F0B' },
  Social:     { color: '#0F6E56', bgColor: '#E1F5EE', textColor: '#0F6E56' },
  Spam:       { color: '#A32D2D', bgColor: '#FCEBEB', textColor: '#A32D2D' }
};

function EmailRow({ email, index, onEmailClick }) {
  const config = categoryConfig[email.category] || categoryConfig.Primary;

  return (
    <div
      onClick={() => onEmailClick && onEmailClick(email)}
      style={{ height: '88px', overflow: 'hidden' }}
      className={`email-row grid grid-cols-[48px_1fr_auto] gap-3 sm:gap-4 px-4 sm:px-5 border-b border-gray-200 dark:border-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
        email.unread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
      }`}
    >
      {/* Avatar */}
      <div className="flex items-center">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{
            backgroundColor: config.bgColor,
            color: config.textColor
          }}
        >
          {email.initials}
        </div>
      </div>

      {/* Email Content */}
      <div className="min-w-0 flex flex-col justify-center gap-0.5">
        <div className={`text-xs sm:text-sm truncate ${
          email.unread
            ? 'font-semibold text-gray-900 dark:text-gray-100'
            : 'font-medium text-gray-600 dark:text-gray-400'
        }`}>
          {email.from}
        </div>
        <div className={`text-sm truncate ${
          email.unread
            ? 'font-medium text-gray-900 dark:text-gray-100'
            : 'text-gray-800 dark:text-gray-200'
        }`}>
          {email.subject}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {email.preview}
        </div>
      </div>

      {/* Time and Badge */}
      <div className="flex flex-col items-end justify-center gap-1.5 min-w-[80px]">
        <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {email.time}
        </div>
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap"
          style={{
            backgroundColor: config.bgColor,
            color: config.textColor
          }}
        >
          {email.category}
        </span>
        {email.unread && (
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        )}
      </div>
    </div>
  );
}

EmailRow.propTypes = {
  email: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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