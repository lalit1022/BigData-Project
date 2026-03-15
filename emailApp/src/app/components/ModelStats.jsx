import { X, Brain, Target, Search, BarChart3, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export default function ModelStats({ onClose }) {
  const [activeTab, setActiveTab] = useState('binary');

  // Binary Classification Data (Spam vs Ham)
  const binaryStats = {
    accuracy: 96.45,
    precision: 95.3,
    recall: 96.5,
    f1_score: 95.8,
    kappa: 0.9175,
    kappaLabel: 'Near Perfect',
    trainingSize: 12867,
    confusionMatrix: [
      { actual: 'Ham', predicted: { Ham: 1756, Spam: 66 } },
      { actual: 'Spam', predicted: { Ham: 27, Spam: 773 } }
    ]
  };

  // 4-Category Classification Data
  const multiStats = {
    accuracy: 77.92,
    precision: 78.3,
    recall: 77.9,
    f1_score: 77.9,
    kappa: 0.6979,
    kappaLabel: 'Substantial Agreement',
    trainingSize: 12867,
    confusionMatrix: [
      { actual: 'Primary', predicted: { Primary: 617, Promotions: 48, Social: 104, Spam: 58 } },
      { actual: 'Promotions', predicted: { Primary: 128, Promotions: 398, Social: 69, Spam: 4 } },
      { actual: 'Social', predicted: { Primary: 107, Promotions: 30, Social: 255, Spam: 4 } },
      { actual: 'Spam', predicted: { Primary: 17, Promotions: 3, Social: 7, Spam: 773 } }
    ]
  };

  const stats = activeTab === 'binary' ? binaryStats : multiStats;
  const categories = activeTab === 'binary' ? ['Ham', 'Spam'] : ['Primary', 'Promotions', 'Social', 'Spam'];
  const categoryColors = activeTab === 'binary' 
    ? { Ham: '#0F6E56', Spam: '#A32D2D' }
    : { Primary: '#185FA5', Promotions: '#854F0B', Social: '#0F6E56', Spam: '#A32D2D' };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Mahout Model Performance
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Naive Bayes Classifier • Trained on {stats.trainingSize.toLocaleString()} emails
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex justify-center border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-6">
            <button
              onClick={() => setActiveTab('binary')}
              className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                activeTab === 'binary'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Binary Classification
              {activeTab === 'binary' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('multi')}
              className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                activeTab === 'multi'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              4-Category Classification
              {activeTab === 'multi' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <MetricCard
                label="Overall Accuracy"
                value={stats.accuracy}
                color="#185FA5"
                icon={Target}
              />
              <MetricCard
                label="Precision"
                value={stats.precision}
                color="#0F6E56"
                icon={Search}
              />
              <MetricCard
                label="Recall"
                value={stats.recall}
                color="#854F0B"
                icon={BarChart3}
              />
              <MetricCard
                label="F1 Score"
                value={stats.f1_score}
                color="#7F77DD"
                icon={Zap}
              />
            </div>

            {/* Kappa Score Banner */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <TrendingUp size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Cohen's Kappa Score: <span className="text-blue-600 dark:text-blue-400">{stats.kappa.toFixed(4)}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {stats.kappaLabel} • {activeTab === 'binary' ? 'Exceptional' : 'Good'} model agreement
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Confusion Matrix {activeTab === 'binary' ? '(2×2)' : '(4×4)'}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                  Hadoop MapReduce Output
                </span>
              </div>
              <div className="overflow-x-auto bg-white dark:bg-gray-800/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-left p-3 border-b border-gray-200 dark:border-gray-700">
                        Actual \ Predicted
                      </th>
                      {categories.map((cat) => (
                        <th
                          key={cat}
                          className="text-sm font-bold text-center p-3 border-b border-gray-200 dark:border-gray-700"
                          style={{ color: categoryColors[cat] }}
                        >
                          {cat}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.confusionMatrix.map((row) => {
                      const actualCategory = row.actual;
                      return (
                        <tr key={actualCategory} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td
                            className="text-sm font-bold p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                            style={{ color: categoryColors[actualCategory] }}
                          >
                            {actualCategory}
                          </td>
                          {categories.map((predictedCat) => {
                            const count = row.predicted[predictedCat] || 0;
                            const isCorrect = actualCategory === predictedCat;
                            return (
                              <td
                                key={predictedCat}
                                className={`text-base font-semibold text-center p-3 border-b border-gray-200 dark:border-gray-700 ${
                                  isCorrect
                                    ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 font-bold'
                                    : count > 0
                                    ? 'text-gray-500 dark:text-gray-400'
                                    : 'text-gray-300 dark:text-gray-700'
                                }`}
                              >
                                {count}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-3 flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600" />
                  <span className="font-medium">Correct predictions (diagonal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600" />
                  <span className="font-medium">Misclassifications</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function MetricCard({ label, value, color, icon: Icon }) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = value;
    const increment = target / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedValue(target);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={16} style={{ color: color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ color: color }}>
        {animatedValue.toFixed(1)}%
      </div>
    </motion.div>
  );
}