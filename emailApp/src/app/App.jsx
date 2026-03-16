import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Sun, Moon } from "lucide-react";
import Sidebar from "./components/Sidebar";
import VirtualEmailList from "./components/VirtualEmailList";
import EmailDetail from "./components/EmailDetail";
import EmailListSkeleton from "./components/EmailListSkeleton";
import BottomPanel from "./components/BottomPanel";
import ModelStats from "./components/ModelStats";
import { getAllEmails, getPipelineStatus } from "./api";

// Theme Toggle Component
function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon size={18} className="text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun size={18} className="text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}

// MOCK EMAILS - Shown before pipeline completes
const MOCK_EMAILS = [
  {
    id: 1,
    from: "Sarah Johnson",
    initials: "SJ",
    category: "Primary",
    subject: "Q4 budget review meeting",
    preview: "Hi team, please find the agenda for tomorrow's review...",
    time: "9:41 AM",
    unread: true,
  },
  {
    id: 2,
    from: "Amazon Deals",
    initials: "AM",
    category: "Promotions",
    subject: "Flash sale — 50% off today only",
    preview: "Don't miss our biggest sale of the year, limited time...",
    time: "8:30 AM",
  },
  {
    id: 3,
    from: "LinkedIn",
    initials: "in",
    category: "Social",
    subject: "John liked your post",
    preview: "Your article on machine learning got 47 reactions...",
    time: "7:15 AM",
  },
  {
    id: 4,
    from: "Unknown Sender",
    initials: "??",
    category: "Spam",
    subject: "You have won $1,000,000 lottery prize",
    preview: "Click here immediately to claim your prize...",
    time: "6:00 AM",
  },
  {
    id: 5,
    from: "Mike Chen",
    initials: "MC",
    category: "Primary",
    subject: "Re: Project handover docs",
    preview: "Thanks for the detailed notes, will review by EOD...",
    time: "Yesterday",
    unread: true,
  },
  {
    id: 6,
    from: "Flipkart",
    initials: "FK",
    category: "Promotions",
    subject: "Exclusive offer just for you — 30% off",
    preview: "Shop now and save big on electronics...",
    time: "Yesterday",
  },
  {
    id: 7,
    from: "Eventbrite",
    initials: "EB",
    category: "Social",
    subject: "New event: Tech Meetup 2026",
    preview: "Join 200+ developers this Saturday in your city...",
    time: "Mon",
  },
  {
    id: 8,
    from: "Suspicious Email",
    initials: "!!",
    category: "Spam",
    subject: "Urgent: Verify your bank account now",
    preview: "Your account suspended unless you verify details...",
    time: "Mon",
  },
  {
    id: 9,
    from: "David Martinez",
    initials: "DM",
    category: "Primary",
    subject: "Quarterly performance feedback",
    preview: "Great work on the last sprint! Let's discuss next steps...",
    time: "Mon",
    unread: true,
  },
  {
    id: 10,
    from: "Uber Eats",
    initials: "UE",
    category: "Promotions",
    subject: "Free delivery on your next order",
    preview: "Use code FREEDEL at checkout, valid until midnight...",
    time: "Sun",
  },
  {
    id: 11,
    from: "Facebook",
    initials: "FB",
    category: "Social",
    subject: "You have 5 friend requests",
    preview: "People you may know: Jessica Smith, Ryan Lee...",
    time: "Sun",
  },
  {
    id: 12,
    from: "No Reply",
    initials: "NR",
    category: "Spam",
    subject: "Congratulations! You are selected",
    preview: "You have been chosen for a special offer...",
    time: "Sat",
  },
  {
    id: 13,
    from: "Jennifer Lee",
    initials: "JL",
    category: "Primary",
    subject: "Design mockups ready for review",
    preview: "Attached are the latest UI designs for the dashboard...",
    time: "Sat",
  },
  {
    id: 14,
    from: "Netflix",
    initials: "NF",
    category: "Promotions",
    subject: "New releases this week",
    preview: "Check out the latest shows and movies added to your list...",
    time: "Fri",
  },
  {
    id: 15,
    from: "Twitter",
    initials: "TW",
    category: "Social",
    subject: "Your tweet got 100 likes",
    preview: "Your post about AI trends is getting attention...",
    time: "Fri",
    unread: true,
  },
  {
    id: 16,
    from: "Security Alert",
    initials: "SA",
    category: "Spam",
    subject: "Unusual activity detected",
    preview: "Click to verify your identity immediately...",
    time: "Thu",
  },
  {
    id: 17,
    from: "Robert Kim",
    initials: "RK",
    category: "Primary",
    subject: "Meeting notes from standup",
    preview: "Action items: Fix bug #234, review PR #567...",
    time: "Thu",
  },
  {
    id: 18,
    from: "Spotify",
    initials: "SP",
    category: "Promotions",
    subject: "Your personalized playlist is ready",
    preview: "Discover new music based on your recent listening...",
    time: "Wed",
  },
  {
    id: 19,
    from: "Instagram",
    initials: "IG",
    category: "Social",
    subject: "Sarah started following you",
    preview: "You have 3 new followers this week...",
    time: "Wed",
  },
  {
    id: 20,
    from: "Prize Center",
    initials: "PC",
    category: "Spam",
    subject: "Claim your iPhone 15 Pro now",
    preview: "You are our lucky winner! Limited time offer...",
    time: "Tue",
  },
  {
    id: 21,
    from: "Amanda Wilson",
    initials: "AW",
    category: "Primary",
    subject: "Invoice for February services",
    preview: "Please find attached the invoice for last month...",
    time: "Tue",
  },
  {
    id: 22,
    from: "Best Buy",
    initials: "BB",
    category: "Promotions",
    subject: "Weekend deals — up to 40% off",
    preview: "Save big on laptops, TVs, and more this weekend...",
    time: "Tue",
  },
];

// Calculate category counts from email array
function calculateCategoryCounts(emails) {
  const counts = {
    all: emails.length,
    Primary: 0,
    Promotions: 0,
    Social: 0,
    Spam: 0,
  };

  emails.forEach((email) => {
    if (email.category && counts.hasOwnProperty(email.category)) {
      counts[email.category]++;
    }
  });

  return counts;
}

function AppContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showPanel, setShowPanel] = useState(false);
  const [panelTab, setPanelTab] = useState("single");
  const [showModelStats, setShowModelStats] = useState(false);

  // Email state - starts with mock data
  const [emails, setEmails] = useState(MOCK_EMAILS);
  const [isRealData, setIsRealData] = useState(false);

  // Selected email for detail view
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineJobId, setPipelineJobId] = useState(null);

  // Calculate category counts dynamically
  const categoryCounts = calculateCategoryCounts(emails);

  // Reset selected email when category changes
  useEffect(() => {
    setSelectedEmail(null);
  }, [activeCategory]);

  // Poll Flask every 2 seconds while pipeline is running
  useEffect(() => {
    if (!pipelineRunning) return;
    const interval = setInterval(async () => {
      const statusData = await getPipelineStatus(pipelineJobId);
      if (statusData && statusData.status === "done") {
        clearInterval(interval);
        setPipelineRunning(false);
        const realEmails = await getAllEmails();
        if (realEmails && realEmails.length > 0) {
          const bulkEmails = realEmails.filter(
            (e) => e.source && e.source.startsWith("bulk_"),
          );
          if (bulkEmails.length > 0) {
            setEmails(bulkEmails);
            setIsRealData(true);
          }
        }
      }
      // ADD THIS — stop skeleton on error too
      if (statusData && statusData.status === "error") {
        clearInterval(interval);
        setPipelineRunning(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pipelineRunning, pipelineJobId]);

  useEffect(() => {
    async function loadInitialEmails() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/emails`,
        );
        if (!res.ok) throw new Error("Flask not available");

        const data = await res.json();

        // Only switch to real data if bulk emails exist
        // Filter out single-classified emails for initial load
        const bulkEmails = data.filter(
          (e) => e.source && e.source.startsWith("bulk_"),
        );

        if (bulkEmails.length > 0) {
          setEmails(bulkEmails);
          setIsRealData(true);
          console.log(`Loaded ${bulkEmails.length} bulk classified emails`);
        } else {
          // No bulk emails — stay on mock data
          console.log("No bulk emails found — showing mock data");
          setIsRealData(false);
        }
      } catch (err) {
        console.log("Flask not available — using mock data");
        setIsRealData(false);
      }
    }
    loadInitialEmails();
  }, []);

  const handleClassifyEmail = useCallback((newEmail) => {
    // Add new classified email to the top of the list
    setEmails((prev) => [newEmail, ...prev]);
  }, []);

  const handlePipelineStart = useCallback(() => {
    setPipelineRunning(true);
  }, []);

  const handlePipelineComplete = useCallback((jobId) => {
    setPipelineJobId(jobId);
    // The useEffect will handle fetching real emails
  }, []);

  const handleOpenPanel = useCallback((tab) => {
    setPanelTab(tab);
    setShowPanel(true);
  }, []);

  const handleCloseEmailDetail = useCallback(() => {
    setSelectedEmail(null);
  }, []);

  const handleShowModelStats = useCallback(() => {
    setShowModelStats(true);
  }, []);

  const handleCloseModelStats = useCallback(() => {
    setShowModelStats(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 transition-colors duration-300">
      <div className="h-screen flex flex-col max-w-[1800px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="app-container bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 flex-1 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] flex-1 overflow-hidden">
            <Sidebar
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              categoryCounts={categoryCounts}
              onShowModelStats={handleShowModelStats}
              isRealData={isRealData}
            />

            <div className="flex flex-col h-full overflow-hidden">
              {/* Top Bar - Fixed */}
              <div className="topbar px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/50 transition-colors flex-shrink-0">
                <div className="flex items-center gap-3 flex-1">
                  {/* Mobile Logo */}
                  <div className="lg:hidden flex items-center gap-2 mr-3">
                    <img
                      src="/logo.svg"
                      alt="MailAI logo"
                      className="w-8 h-8 rounded-lg shadow-md"
                    />
                  </div>
                  <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {activeCategory === "all"
                      ? `All Mail — ${categoryCounts.all.toLocaleString()} emails ${isRealData ? "classified" : "(sample)"}`
                      : `${activeCategory} — ${categoryCounts[activeCategory].toLocaleString()} emails`}
                  </h1>
                  {!isRealData && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                      Sample Data
                    </span>
                  )}
                  {pipelineRunning && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium animate-pulse">
                      Pipeline Running...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ThemeToggle />
                  <button
                    onClick={() => handleOpenPanel("single")}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Classify one
                  </button>
                  <button
                    onClick={() => handleOpenPanel("bulk")}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Upload dataset
                  </button>
                </div>
              </div>

              {/* Tabs - Fixed */}
              <div className="tabs flex border-b border-gray-200 dark:border-gray-800 px-5 gap-1 overflow-x-auto bg-white dark:bg-gray-900/30 transition-colors flex-shrink-0">
                {["all", "Primary", "Promotions", "Social", "Spam"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveCategory(tab);
                      }}
                      className={`tab px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                        activeCategory === tab
                          ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                          : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                    >
                      {tab === "all" ? "All" : tab}
                    </button>
                  ),
                )}
              </div>

              {/* Email List or Email Detail - Scrollable */}
              {pipelineRunning ? (
                <EmailListSkeleton />
              ) : selectedEmail ? (
                <EmailDetail
                  email={selectedEmail}
                  onClose={handleCloseEmailDetail}
                />
              ) : (
                <VirtualEmailList
                  emails={emails}
                  activeCategory={activeCategory}
                  onOpenClassify={() => handleOpenPanel("single")}
                  onOpenUpload={() => handleOpenPanel("bulk")}
                  onEmailClick={setSelectedEmail}
                />
              )}

              {/* Footer - Fixed */}
              <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-center transition-colors flex-shrink-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email Classification System •{" "}
                  {isRealData ? "MongoDB Backend" : "Mock Data"} • Powered by
                  Hadoop & Mahout • {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel Modal */}
      <BottomPanel
        isOpen={showPanel}
        activeTab={panelTab}
        onTabChange={setPanelTab}
        onClose={() => setShowPanel(false)}
        onClassify={handleClassifyEmail}
        onPipelineStart={handlePipelineStart}
        onPipelineComplete={handlePipelineComplete}
      />

      {/* Model Stats Modal */}
      <AnimatePresence>
        {showModelStats && <ModelStats onClose={handleCloseModelStats} />}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
