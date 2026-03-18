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

const senderPool = [
  "Sarah Johnson",
  "Michael Chen",
  "Amazon Deals",
  "LinkedIn Notifications",
  "Netflix",
  "Twitter Updates",
  "David Martinez",
  "Unknown Sender",
  "Facebook",
  "Eventbrite",
  "Uber Eats",
  "Spotify Premium",
  "Jennifer Lee",
  "Robert Kim",
  "Prize Center",
  "Security Alert",
  "Amanda Wilson",
  "Best Buy",
  "Flipkart Offers",
  "Instagram",
];

// Samples match exact training data patterns for accurate classification
const emailSamples = [
  // Primary — work discussion style
  {
    subject: "work discussion project update",
    body: "hi team please find attached the project update report for this week we have completed the backend integration and are now moving to testing phase please review and provide feedback before friday meeting",
  },
  {
    subject: "meeting scheduled quarterly review",
    body: "this is to inform you that the quarterly performance review meeting has been scheduled for next monday at 10am please come prepared with your team updates and budget projections for discussion",
  },
  {
    subject: "invoice payment due this month",
    body: "please find attached the invoice for consulting services rendered last month the total amount due is as per the agreement payment is expected within thirty days of receipt thank you",
  },
  {
    subject: "casual chat hobbies weekend plans",
    body: "hey just wanted to catch up and see how things are going with you been a while since we last spoke hope work is treating you well let me know if you want to grab coffee this weekend",
  },
  {
    subject: "work discussion system maintenance",
    body: "please be advised that scheduled system maintenance will take place this saturday from midnight to sunday morning during this time all services will be temporarily unavailable we apologize for any inconvenience",
  },

  // Promotions — offer style
  {
    subject: "special offer for sale limited time",
    body: "we have an exclusive special offer just for you get up to sixty percent off on all products this weekend only free shipping on orders above five hundred use code save60 at checkout hurry offer expires sunday",
  },
  {
    subject: "flash sale discount shop now",
    body: "huge flash sale happening now don't miss out on our biggest discount event of the year all categories included electronics fashion home appliances up to seventy percent off shop now before stocks run out",
  },
  {
    subject: "exclusive deal personalized offer",
    body: "based on your recent purchases we have curated these exclusive deals specially for you premium products at unbeatable prices free delivery guaranteed satisfaction or money back limited stock available order now",
  },
  {
    subject: "clearance sale final hours",
    body: "last chance to grab our clearance sale items prices have been slashed to their lowest ever this is a final clearance before new stock arrives don't miss this opportunity to save big shop now",
  },

  // Social — notification style
  {
    subject: "facebook notification you have new activity",
    body: "hi someone just liked your recent post on facebook log in now to see who interacted with your content and respond to comments your post is getting a lot of attention this week thanks the facebook team",
  },
  {
    subject: "linkedin notification new connection request",
    body: "hi you have a new connection request on linkedin john smith who works at microsoft wants to connect with you log in now to accept or decline this request and grow your professional network",
  },
  {
    subject: "twitter notification alex tagged you in photo",
    body: "hi alex just tagged you in a photo on twitter log in now to see the photo and respond to the tag your tweet about technology trends is getting a lot of retweets and likes this week",
  },
  {
    subject: "instagram notification david sent connection request",
    body: "hi david just sent you a connection request on instagram log in now to see the details and respond someone also commented on your latest photo check your notifications for more updates thanks instagram team",
  },
  {
    subject: "pinterest notification chris tagged you",
    body: "hi chris just tagged you in a photo on pinterest log in now to see the details and respond your recent pins are getting lots of saves and your follower count has increased this week thanks pinterest team",
  },

  // Spam — urgent/prize style
  {
    subject: "claim your money prize winner selected",
    body: "congratulations you have been selected as the lucky winner of our international prize draw your prize money is ready to be claimed click the link below immediately to verify your identity and collect your winnings",
  },
  {
    subject: "urgent verify your account now",
    body: "your account has been flagged for suspicious activity and will be suspended within 24 hours unless you verify your identity immediately click here to confirm your details and prevent permanent account closure",
  },
  {
    subject: "limited time offer free gift selected",
    body: "you have been randomly selected to receive a free gift worth five hundred dollars as part of our customer appreciation program just pay a small shipping fee to claim your gift act now limited time only",
  },
  {
    subject: "pre approved loan instant cash",
    body: "congratulations you are pre approved for an instant personal loan of up to fifty thousand dollars no credit check required no documents needed apply now and receive cash within hours offer expires today",
  },
  {
    subject: "you won lottery international prize",
    body: "dear winner you have won our international lottery draw the prize amount of one million dollars is waiting for you please contact us immediately with your personal details to process your winning claim today",
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
    const sender = senderPool[Math.floor(Math.random() * senderPool.length)];
    const email = emailSamples[Math.floor(Math.random() * emailSamples.length)];
    setFormData({ from: sender, subject: email.subject, body: email.body });
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
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
