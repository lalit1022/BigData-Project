import { Mail, Tag, Sparkles, Zap, Brain } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

const categoryConfig = {
  Primary: { color: "#185FA5", bgColor: "#E6F1FB" },
  Promotions: { color: "#854F0B", bgColor: "#FAEEDA" },
  Social: { color: "#0F6E56", bgColor: "#E1F5EE" },
  Spam: { color: "#A32D2D", bgColor: "#FCEBEB" },
};

export default function Sidebar({
  activeCategory,
  onCategoryChange,
  categoryCounts,
  onShowModelStats,
  isRealData,
}) {
  const [accuracy, setAccuracy] = useState(0);
  const targetAccuracy = 97.25;

  useEffect(() => {
    let current = 0;
    const increment = targetAccuracy / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetAccuracy) {
        setAccuracy(targetAccuracy);
        clearInterval(timer);
      } else {
        setAccuracy(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    {
      id: "all",
      label: "All Mail",
      icon: Mail,
      color: "#888780",
      bgColor: "#F1EFE8",
    },
    { id: "Primary", label: "Primary", icon: Tag, ...categoryConfig.Primary },
    {
      id: "Promotions",
      label: "Promotions",
      icon: Sparkles,
      ...categoryConfig.Promotions,
    },
    { id: "Social", label: "Social", icon: Zap, ...categoryConfig.Social },
    { id: "Spam", label: "Spam", icon: Tag, ...categoryConfig.Spam },
  ];

  return (
    <div className="sidebar bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 p-4 transition-colors overflow-y-auto hidden lg:flex lg:flex-col">
      {/* Logo */}
      <div className="mb-6">
        <div className="flex items-center gap-2 px-2">
          <img
            src="/logo.svg"
            alt="MailAI logo"
            className="w-8 h-8 rounded-lg shadow-md"
          />
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">
            MailClassifyAI
          </span>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="space-y-1 flex-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50"
              }`}
            >
              <Icon
                size={16}
                className="flex-shrink-0 transition-transform duration-200 hover:scale-110"
                style={{ color: cat.color }}
              />
              <span className="flex-1 text-left">{cat.label}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: cat.bgColor,
                  color: cat.color,
                }}
              >
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Hadoop Section - Model Accuracy Widget */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Hadoop
          </span>
        </div>

        <motion.button
          onClick={onShowModelStats}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <Brain size={16} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Model Accuracy
              </h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">
                Naive Bayes
              </p>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {accuracy.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                %
              </span>
            </div>
          </div>

          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm"
            />
          </div>

          <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 text-left">
            Click to view detailed stats
          </div>
        </motion.button>
      </div>

      {/* Data Source Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isRealData ? "bg-green-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {isRealData ? "Live Data" : "Sample Data"}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {isRealData
              ? "MongoDB connected"
              : "Upload dataset to load real emails"}
          </p>
        </div>
      </div>
    </div>
  );
}
