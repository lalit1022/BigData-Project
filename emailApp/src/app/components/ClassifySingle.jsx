import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { classifySingleEmail } from "../api";
import NotificationToast from "./NotificationToast";
const categoryConfig = {
  Primary: { color: "#185FA5", bgColor: "#E6F1FB" },
  Promotions: { color: "#854F0B", bgColor: "#FAEEDA" },
  Social: { color: "#0F6E56", bgColor: "#E1F5EE" },
  Spam: { color: "#A32D2D", bgColor: "#FCEBEB" },
};

// Curated samples with realistic sender/subject/body combinations.
// Keep category-indicative keywords so quick random testing remains reliable.
const emailSamples = [
  // Primary
  {
    from: "Nora Patel",
    subject: "Project update: API integration completed",
    body: "Hi team, the API integration is complete and deployed to staging. Please review the endpoint changes before tomorrow's standup and share any blockers by 6 PM.",
  },
  {
    from: "Finance Ops",
    subject: "Invoice INV-2048 due on March 28",
    body: "Hello, this is a reminder that invoice INV-2048 for consulting services is due on March 28. Kindly process payment this week and confirm once done.",
  },
  {
    from: "Aarav Mehta",
    subject: "Rescheduled 1:1 to Thursday",
    body: "Could we move our 1:1 from Wednesday to Thursday at 11:30 AM? I need to finish the release notes before we review hiring plans.",
  },
  {
    from: "HR Team",
    subject: "Action required: submit reimbursement receipts",
    body: "Please upload your travel reimbursement receipts in the portal by Friday. Late submissions will be processed in next month's payroll cycle.",
  },
  {
    from: "DevOps Alerts",
    subject: "Planned maintenance window this Saturday",
    body: "Scheduled maintenance is planned for Saturday from 12:30 AM to 2:00 AM IST. During this period, dashboard login may be intermittently unavailable.",
  },
  {
    from: "Priya Raman",
    subject: "Draft contract attached for review",
    body: "I've attached the latest contract draft with comments from legal. Please review section 4 and 7 before we send it to the client.",
  },
  {
    from: "Campus Housing Office",
    subject: "Lease renewal reminder",
    body: "Your lease renewal window opens next Monday. Submit the renewal form before April 5 to keep your current apartment assignment.",
  },
  {
    from: "Product Team",
    subject: "Meeting notes: onboarding funnel discussion",
    body: "Thanks for joining today's onboarding funnel review. Action items are documented in the shared doc, including copy updates and analytics events.",
  },

  // Promotions
  {
    from: "Amazon Deals",
    subject: "Flash sale: up to 60% off electronics today",
    body: "Limited-time flash sale is live now. Save up to 60% on headphones, monitors, and smart home devices. Offer ends tonight at 11:59 PM.",
  },
  {
    from: "Myntra Offers",
    subject: "Extra 25% OFF with code STYLE25",
    body: "Refresh your wardrobe with this exclusive offer. Apply code STYLE25 at checkout for an extra 25% discount on selected fashion brands.",
  },
  {
    from: "Uber Eats",
    subject: "Free delivery on your next 3 orders",
    body: "Hungry? Get free delivery on your next 3 orders above Rs 199. Use promo code EATNOW before Sunday. Terms and conditions apply.",
  },
  {
    from: "Best Buy",
    subject: "Weekend deals: laptops from $399",
    body: "Weekend promotion starts now. Shop laptops, accessories, and TVs with limited-stock discount pricing available through Monday morning.",
  },
  {
    from: "Spotify Premium",
    subject: "Premium individual plan at 50% for 2 months",
    body: "Special offer for selected users: get Premium at 50% off for 2 months. Enjoy ad-free music, offline playback, and high-quality audio.",
  },
  {
    from: "Flipkart Offers",
    subject: "Big Saving Days starts at midnight",
    body: "Don't miss Big Saving Days. Early access deals include smartphones, appliances, and furniture with additional bank cashback offers.",
  },
  {
    from: "Sephora",
    subject: "Buy 2 get 1 free: skincare essentials",
    body: "Stock up on your favorites with our buy 2 get 1 free skincare promotion. Ends in 24 hours. Free shipping on orders above $50.",
  },
  {
    from: "Netflix",
    subject: "Upgrade offer: Premium at a lower price",
    body: "For a limited period, upgrade to Premium at a discounted monthly rate. Watch in 4K and stream on more devices with this exclusive deal.",
  },

  // Social
  {
    from: "Instagram",
    subject: "Aanya started following you",
    body: "Aanya Sharma started following you on Instagram. See their profile, follow back, and check your latest post comments in notifications.",
  },
  {
    from: "Instagram",
    subject: "You have 3 new comments",
    body: "Your reel received 3 new comments and 12 likes in the last hour. Open Instagram to reply and keep the conversation going.",
  },
  {
    from: "LinkedIn Notifications",
    subject: "Rahul sent you a connection request",
    body: "Rahul Verma, Senior Engineer at Atlassian, wants to connect with you on LinkedIn. Review their profile and respond to the request.",
  },
  {
    from: "LinkedIn Notifications",
    subject: "Your post got 42 reactions",
    body: "People in your network are engaging with your post about data pipelines. See who reacted and replied in your LinkedIn feed.",
  },
  {
    from: "X (Twitter) Notifications",
    subject: "Maya mentioned you in a post",
    body: "Maya tagged you in a new post on X. Join the thread and reply to comments from your followers.",
  },
  {
    from: "Facebook",
    subject: "You have 5 new friend requests",
    body: "You have 5 pending friend requests on Facebook. Review mutual friends and accept or decline from your notifications tab.",
  },
  {
    from: "Eventbrite",
    subject: "Your friend is attending Tech Meetup 2026",
    body: "Arjun and 14 others from your network are attending Tech Meetup 2026. View event updates and RSVP changes on Eventbrite.",
  },
  {
    from: "Reddit",
    subject: "3 replies to your comment in r/machinelearning",
    body: "There are 3 new replies to your comment in r/machinelearning. Jump back into the discussion and view upvotes.",
  },

  // Spam
  {
    from: "Prize Center",
    subject: "Congratulations! Claim your $1,000,000 prize now",
    body: "You are the selected winner of an international cash prize. To claim your money reward immediately, verify your details at the link below.",
  },
  {
    from: "Secure Banking Alert",
    subject: "Urgent: verify your account within 24 hours",
    body: "Suspicious activity has been detected on your account. Your access will be suspended unless you confirm password and card details right now.",
  },
  {
    from: "Loan Desk",
    subject: "Pre-approved loan with no documents required",
    body: "Get instant cash up to 50,000 with guaranteed approval and no credit check. Apply now and receive funds in 30 minutes.",
  },
  {
    from: "Gift Redemption",
    subject: "Free iPhone selected for your number",
    body: "Your phone number was selected to receive a free iPhone. Pay a small delivery fee now to unlock shipment before this offer expires.",
  },
  {
    from: "Lottery Board",
    subject: "Winner notice: international lottery payout",
    body: "You have won an international lottery payout of 750,000 dollars. Send your full name, address, and bank account to process transfer.",
  },
  {
    from: "Crypto Returns",
    subject: "Double your money in 7 days guaranteed",
    body: "Exclusive crypto investment opportunity with guaranteed 200 percent return. Limited slots available. Deposit now to secure your profits.",
  },
  {
    from: "Account Security Team",
    subject: "Final warning: mailbox will be deactivated",
    body: "Your mailbox storage is full and account will be deactivated today. Click here to re-validate credentials and keep your email active.",
  },
  {
    from: "Tax Refund Office",
    subject: "Pending tax refund release - action needed",
    body: "You are eligible for an urgent tax refund. Confirm identity and banking information now to avoid cancellation of refund processing.",
  },

  // Extra mixed realistic samples to enlarge pool
  {
    from: "Customer Success",
    subject: "Client escalation summary and next steps",
    body: "Please review the escalation summary for the Northwind account. We need approval on the proposed SLA credits before sharing the final response.",
  },
  {
    from: "Coursera",
    subject: "Enrollment offer: 40% off annual plan",
    body: "Upgrade to Coursera Plus annual and save 40% today. Access thousands of courses and certificates with this personalized discount.",
  },
  {
    from: "YouTube",
    subject: "Your channel got 1,200 new views",
    body: "Great news! Your latest video is trending with 1,200 new views and 84 comments. See detailed analytics in YouTube Studio.",
  },
  {
    from: "Claim Office",
    subject: "Immediate response needed to release compensation",
    body: "Your compensation file is pending and may be revoked. Confirm personal information now to release payment to your account immediately.",
  },
];

export default function ClassifySingle({ onClassify }) {
  const [formData, setFormData] = useState({ from: "", subject: "", body: "" });
  const [result, setResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [lastClassified, setLastClassified] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject && !formData.body) return;
    setIsClassifying(true);
    setResult(null);
    try {
      const response = await classifySingleEmail(formData);
      const config = categoryConfig[response.category];
      const resultData = {
        category: response.category,
        confidence: response.confidence,
        classifier: response.classifier || "Naive Bayes (Mahout)",
        config,
        subject: formData.subject || "(no subject)",
        from: formData.from || "Unknown Sender",
      };
      setResult(resultData);
      setLastClassified(resultData);
      onClassify({
        id: Date.now() + Math.random(),
        from: formData.from || "Unknown Sender",
        initials: (formData.from || "US").slice(0, 2).toUpperCase(),
        category: response.category,
        confidence: response.confidence,
        subject: formData.subject || "(no subject)",
        preview: formData.body || "",
        time: "Just now",
        unread: true,
      });
      setTimeout(() => {
        setFormData({ from: "", subject: "", body: "" });
        setResult(null);
      }, 3000);
    } catch (error) {
      setToastMessage("Flask is not running !");
      setToastType("error");
    } finally {
      setIsClassifying(false);
    }
  };

  const generateRandomEmail = () => {
    const email = emailSamples[Math.floor(Math.random() * emailSamples.length)];
    setFormData({
      from: email.from || "Unknown Sender",
      subject: email.subject,
      body: email.body,
    });
    setResult(null);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return "#0F6E56";
    if (confidence >= 0.8) return "#185FA5";
    if (confidence >= 0.7) return "#854F0B";
    return "#A32D2D";
  };

  const activeResult = result || lastClassified;

  return (
    <div className="panel-body p-6">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          Test Email Classification
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter email details or generate a random sample to test the Mahout
          classifier
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Sender
            </label>
            <input
              type="text"
              placeholder="e.g., Amazon, LinkedIn, or sender's name"
              value={formData.from}
              onChange={(e) =>
                setFormData({ ...formData, from: e.target.value })
              }
              className="w-full px-4 py-3 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-4 py-3 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Email Body
            </label>
            <textarea
              placeholder="Enter email body text here..."
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={isClassifying || (!formData.subject && !formData.body)}
              className="px-6 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="px-6 py-3 text-sm font-semibold rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Random Email
            </button>
          </div>
        </form>

        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {activeResult ? (
              <motion.div
                key={activeResult.category + activeResult.confidence}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border-2 overflow-hidden"
                style={{ borderColor: activeResult.config.color + "40" }}
              >
                <div
                  className="px-4 py-3 flex items-center gap-2"
                  style={{ backgroundColor: activeResult.config.bgColor }}
                >
                  <CheckCircle2
                    size={18}
                    style={{ color: activeResult.config.color }}
                  />
                  <span
                    className="text-sm font-bold"
                    style={{ color: activeResult.config.color }}
                  >
                    Classified as {activeResult.category}
                  </span>
                  {result && (
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/60 font-medium"
                      style={{ color: activeResult.config.color }}
                    >
                      Just now
                    </span>
                  )}
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Confidence Score
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{
                          color: getConfidenceColor(activeResult.confidence),
                        }}
                      >
                        {(activeResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${activeResult.confidence * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: getConfidenceColor(
                            activeResult.confidence,
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-400 w-14 flex-shrink-0">
                        From
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                        {activeResult.from}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-400 w-14 flex-shrink-0">
                        Subject
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {activeResult.subject}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-400 w-14 flex-shrink-0">
                        Method
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 truncate">
                        {activeResult.classifier}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Send size={20} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    No result yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Classify an email to see the result here
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {toastMessage && (
        <NotificationToast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage("")}
        />
      )}
    </div>
  );
}
