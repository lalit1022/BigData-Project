import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PipelineStatus from './PipelineStatus';
import { uploadBulkDataset } from '../api';

const categoryConfig = {
  Primary: { color: '#185FA5', bgColor: '#E6F1FB' },
  Promotions: { color: '#854F0B', bgColor: '#FAEEDA' },
  Social: { color: '#0F6E56', bgColor: '#E1F5EE' },
  Spam: { color: '#A32D2D', bgColor: '#FCEBEB' }
};

export default function BulkUpload({ onPipelineStart, onPipelineComplete }) {
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, complete
  const [fileName, setFileName] = useState('');
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepStatuses, setStepStatuses] = useState(['Waiting', 'Waiting', 'Waiting', 'Waiting']);
  const [stepProgress, setStepProgress] = useState([0, 0, 0, 0]);
  const [results, setResults] = useState(null);
  const [jobId, setJobId] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    setUploadState('uploading');
    setCurrentStep(-1);
    setStepStatuses(['Waiting', 'Waiting', 'Waiting', 'Waiting']);
    setStepProgress([0, 0, 0, 0]);
    setResults(null);

    try {
      // Notify parent that pipeline is starting
      if (onPipelineStart) {
        onPipelineStart();
      }

      // Upload file
      const response = await uploadBulkDataset(file);
      setJobId(response.job_id);
      
      // Start pipeline simulation
      simulatePipeline(response.job_id);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadState('idle');
      alert('Upload failed. Please try again.');
    }
  };

  const simulatePipeline = (jobId) => {
    setUploadState('processing');
    
    const steps = [
      { status: 'Uploading to HDFS...', done: 'Stored in HDFS', duration: 1200 },
      { status: 'MapReduce running...', done: 'Preprocessed 12,867', duration: 2000 },
      { status: 'seq2sparse TF-IDF...', done: 'Vectors ready', duration: 1600 },
      { status: 'Mahout trainnb...', done: 'Classified 12,867', duration: 2200 }
    ];

    let delay = 0;

    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        
        // Update status to in-progress
        setStepStatuses(prev => {
          const newStatuses = [...prev];
          newStatuses[index] = step.status;
          return newStatuses;
        });

        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress = Math.min(progress + 4, 100);
          
          setStepProgress(prev => {
            const newProgress = [...prev];
            newProgress[index] = progress;
            return newProgress;
          });

          if (progress >= 100) {
            clearInterval(interval);
            
            // Update status to complete
            setStepStatuses(prev => {
              const newStatuses = [...prev];
              newStatuses[index] = step.done;
              return newStatuses;
            });

            // If last step, show results and notify parent
            if (index === 3) {
              setTimeout(() => {
                setUploadState('complete');
                animateResults();
                
                // KEY MOMENT: Notify parent that pipeline is complete
                // This will trigger fetching real emails from MongoDB
                if (onPipelineComplete) {
                  onPipelineComplete(jobId);
                }
              }, 300);
            }
          }
        }, step.duration / 25);
      }, delay);

      delay += step.duration + 300;
    });
  };

  const animateResults = () => {
    const finalCounts = { Primary: 3890, Promotions: 2998, Social: 1998, Spam: 3981 };
    const categories = ['Primary', 'Promotions', 'Social', 'Spam'];
    
    setResults({ Primary: 0, Promotions: 0, Social: 0, Spam: 0 });

    categories.forEach((cat) => {
      let count = 0;
      const target = finalCounts[cat];
      const interval = setInterval(() => {
        count = Math.min(count + Math.ceil(target / 40), target);
        setResults(prev => ({ ...prev, [cat]: count }));
        if (count >= target) clearInterval(interval);
      }, 40);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadState('idle');
    setFileName('');
    setCurrentStep(-1);
    setStepStatuses(['Waiting', 'Waiting', 'Waiting', 'Waiting']);
    setStepProgress([0, 0, 0, 0]);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="panel-body p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
          Hadoop Pipeline Processing
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload your dataset to run MapReduce classification and store results in MongoDB
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={uploadState === 'idle' ? handleUploadClick : undefined}
        className={`upload-zone border-2 border-dashed rounded-xl p-8 text-center mb-5 transition-all ${
          uploadState === 'idle'
            ? 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer'
            : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'
        }`}
      >
        {uploadState === 'idle' ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Upload size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              Drop CSV file here or click to browse
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload your email dataset for batch classification
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
              <Database size={14} />
              <span>Required: <span className="font-mono font-semibold">subject</span>, <span className="font-mono font-semibold">body</span> columns</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              {fileName}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-sm font-semibold text-teal-700 dark:text-teal-300">
              {uploadState === 'complete' 
                ? '✓ 12,867 emails classified successfully'
                : '⏳ Processing 12,867 emails through Hadoop pipeline'
              }
            </div>
          </>
        )}
      </div>

      {/* Pipeline Status */}
      <AnimatePresence>
        {uploadState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PipelineStatus
              currentStep={currentStep}
              stepStatuses={stepStatuses}
              stepProgress={stepProgress}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Stats */}
      <AnimatePresence>
        {uploadState === 'complete' && results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-5"
          >
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              Classification Results
            </h4>
            <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {Object.entries(categoryConfig).map(([category, config]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="stat-card bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:shadow-md transition-all"
                >
                  <div
                    className="stat-val text-3xl font-bold mb-1"
                    style={{ color: config.color }}
                  >
                    {results[category].toLocaleString()}
                  </div>
                  <div className="stat-label text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {category}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Button */}
      {uploadState === 'complete' && (
        <div className="text-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 text-sm font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
          >
            Upload Another Dataset
          </button>
        </div>
      )}
    </div>
  );
}