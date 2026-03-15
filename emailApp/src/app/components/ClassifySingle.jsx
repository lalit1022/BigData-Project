import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { classifySingleEmail } from '../api';

const categoryConfig = {
  Primary: { color: '#185FA5', bgColor: '#E6F1FB' },
  Promotions: { color: '#854F0B', bgColor: '#FAEEDA' },
  Social: { color: '#0F6E56', bgColor: '#E1F5EE' },
  Spam: { color: '#A32D2D', bgColor: '#FCEBEB' }
};

// Pools for random email generation
const senderPool = [
  'Sarah Johnson', 'Michael Chen', 'Amazon Deals', 'LinkedIn Notifications',
  'Netflix', 'Twitter Updates', 'David Martinez', 'Unknown Sender',
  'Facebook', 'Eventbrite', 'Uber Eats', 'Spotify Premium',
  'Jennifer Lee', 'Robert Kim', 'Prize Center', 'Security Alert',
  'Amanda Wilson', 'Best Buy', 'Flipkart Offers', 'Instagram'
];

// Complete email samples with matching subject + body pairs
const emailSamples = [
  // Primary emails
  {
    subject: 'Q4 budget review meeting scheduled',
    body: 'Hi team, please find the agenda for tomorrow\'s quarterly budget review meeting attached. We\'ll discuss resource allocation and project funding.'
  },
  {
    subject: 'Re: Project handover documentation',
    body: 'Thanks for the detailed notes. I\'ve reviewed the handover documents and will have the team ready for the transition by end of week.'
  },
  {
    subject: 'Design mockups ready for review',
    body: 'The latest UI designs for the dashboard project are now available. Please review and provide feedback by Friday so we can proceed with implementation.'
  },
  {
    subject: 'Meeting notes from daily standup',
    body: 'Action items from today\'s standup: Complete bug #234 by EOD, review PR #567, and update the deployment documentation.'
  },
  {
    subject: 'Invoice for February consulting services',
    body: 'Please find attached the invoice for consulting services rendered in February. Payment is due within 30 days. Let me know if you have any questions.'
  },
  {
    subject: 'Quarterly performance feedback session',
    body: 'Great work on the last sprint! Your contributions to the ML pipeline have been exceptional. Let\'s schedule time tomorrow to discuss your career goals.'
  },
  
  // Promotions
  {
    subject: 'Flash Sale - 50% off everything today only',
    body: 'Don\'t miss our biggest sale of the year! Get 50% off on all items including electronics, fashion, and home goods. Limited time offer ends tonight at midnight!'
  },
  {
    subject: 'Exclusive offer just for you - Free shipping',
    body: 'As a valued customer, enjoy FREE delivery on your next order. Use code FREEDEL at checkout. Valid until the end of this month!'
  },
  {
    subject: 'Weekend deals - Up to 40% off laptops',
    body: 'Save big this weekend on laptops, tablets, and accessories. Premium brands at unbeatable prices. Shop now before stocks run out!'
  },
  {
    subject: 'New arrivals - Spring collection now live',
    body: 'Discover our latest spring collection with fresh styles and colors. Be the first to shop new arrivals with an exclusive 20% discount for early birds!'
  },
  {
    subject: 'Your personalized deals are waiting',
    body: 'Based on your shopping history, we\'ve curated special offers just for you. Check out these handpicked deals and save up to 60% today!'
  },
  {
    subject: 'Last chance - Clearance sale ends tomorrow',
    body: 'Final hours to grab amazing clearance deals! Prices slashed on thousands of items. Don\'t miss out on savings up to 70% off retail prices.'
  },
  
  // Social
  {
    subject: 'John liked your recent post',
    body: 'Your article on machine learning trends got 47 reactions this week. John Smith, Sarah Lee, and 45 others engaged with your content.'
  },
  {
    subject: 'You have 5 new friend requests',
    body: 'People you may know: Jessica Smith, Ryan Lee, Amanda Chen, and 2 others. Connect with them to expand your professional network.'
  },
  {
    subject: 'Event invitation: Tech Meetup 2026',
    body: 'You\'re invited to our networking event this Saturday! Join 200+ developers in your city for talks, demos, and networking. RSVP now to secure your spot.'
  },
  {
    subject: 'Your tweet is getting a lot of attention',
    body: 'Your post about AI ethics has 156 retweets and 342 likes. @techleader and @airesearcher mentioned you in their responses.'
  },
  {
    subject: 'New event: Virtual Webinar on Cloud Architecture',
    body: 'Join our free webinar next Friday at 2 PM. Industry experts will discuss best practices for cloud-native development. Register now, limited seats available!'
  },
  {
    subject: 'Your connection shared a new article',
    body: 'Michael Chen shared an article that might interest you: "The Future of DevOps in 2026". Read and join the discussion with your network.'
  },
  
  // Spam
  {
    subject: 'You won $1,000,000 lottery prize!!!',
    body: 'CONGRATULATIONS! You have been selected as the winner of our international lottery. Click here immediately to claim your $1,000,000 prize before it expires!'
  },
  {
    subject: 'URGENT: Verify your bank account now',
    body: 'Your account will be suspended unless you verify your details within 24 hours. Click this link now to confirm your identity and prevent account closure.'
  },
  {
    subject: 'Unusual activity detected on your account',
    body: 'We detected suspicious login attempts on your account from an unknown location. Verify your identity immediately or your account will be permanently locked.'
  },
  {
    subject: 'You are pre-approved for $50,000 loan',
    body: 'Congratulations! You qualify for an instant $50,000 loan with no credit check required. Limited time offer - apply now and get cash within hours!'
  },
  {
    subject: 'Hot singles in your area want to meet you',
    body: 'Click here to see profiles of attractive singles near you looking for romance. Join now absolutely free and start chatting today!'
  },
  {
    subject: 'Make $5000 per week working from home',
    body: 'Earn easy money from home with no experience needed! This secret method will make you rich fast. Click now to learn the simple trick that banks hate!'
  },
  {
    subject: 'Your package is waiting - confirm delivery',
    body: 'A package addressed to you is being held at our facility. Click the link below to confirm your shipping address and schedule delivery before it\'s returned.'
  },
  {
    subject: 'Claim your free iPhone 15 Pro now',
    body: 'You have been randomly selected to receive a FREE iPhone 15 Pro! Just pay $5 shipping. Limited quantities available - claim yours before they run out!'
  }
];

export default function ClassifySingle({ onClassify }) {
  const [formData, setFormData] = useState({
    from: '',
    subject: '',
    body: ''
  });
  const [result, setResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject && !formData.body) {
      return;
    }

    setIsClassifying(true);
    setResult(null);

    try {
      const response = await classifySingleEmail(formData);
      
      const config = categoryConfig[response.category];
      setResult({ 
        category: response.category, 
        config,
        classifier: response.classifier || 'Naive Bayes (Mahout)'
      });

      // Create email object and add to list
      const newEmail = {
        id: Date.now() + Math.random(), // Ensure unique ID
        from: formData.from || 'Unknown Sender',
        initials: (formData.from || 'US').slice(0, 2).toUpperCase(),
        category: response.category,
        subject: formData.subject || '(no subject)',
        preview: formData.body || '(no body)',
        time: 'Just now',
        unread: true
      };

      onClassify(newEmail);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({ from: '', subject: '', body: '' });
        setResult(null);
      }, 2000);
    } catch (error) {
      console.error('Classification error:', error);
    } finally {
      setIsClassifying(false);
    }
  };

  const generateRandomEmail = () => {
    const randomSender = senderPool[Math.floor(Math.random() * senderPool.length)];
    const randomEmail = emailSamples[Math.floor(Math.random() * emailSamples.length)];
    
    setFormData({
      from: randomSender,
      subject: randomEmail.subject,
      body: randomEmail.body
    });
    setResult(null);
  };

  return (
    <div className="panel-body p-6">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          Test Email Classification
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter email details or generate a random sample to test the Mahout classifier
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Sender
          </label>
          <input
            type="text"
            placeholder="e.g., Amazon, LinkedIn, or sender's name"
            value={formData.from}
            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
            className="w-full px-4 py-3 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Subject Line
          </label>
          <input
            type="text"
            placeholder="e.g., Flash sale — 50% off today only"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-3 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Email Body
          </label>
          <textarea
            placeholder="e.g., Don't miss our biggest sale of the year, limited time offer!"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isClassifying || (!formData.subject && !formData.body)}
            className="px-6 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isClassifying ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Classifying...
              </>
            ) : (
              <>
                <Send size={18} />
                Classify Email
              </>
            )}
          </button>

          <button
            type="button"
            onClick={generateRandomEmail}
            className="px-6 py-3 text-sm font-semibold rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Random Email
          </button>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-3 sm:ml-auto"
              >
                <span
                  className="text-sm font-bold px-5 py-2.5 rounded-lg shadow-md"
                  style={{
                    backgroundColor: result.config.bgColor,
                    color: result.config.color
                  }}
                >
                  {result.category}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Classification Method:</span> {result.classifier}
            </p>
          </motion.div>
        )}
      </form>
    </div>
  );
}