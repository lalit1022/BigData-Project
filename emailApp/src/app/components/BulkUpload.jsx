import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Database, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PipelineStatus from "./PipelineStatus";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const categoryConfig = {
  Primary: { color: "#185FA5", bgColor: "#E6F1FB" },
  Promotions: { color: "#854F0B", bgColor: "#FAEEDA" },
  Social: { color: "#0F6E56", bgColor: "#E1F5EE" },
  Spam: { color: "#A32D2D", bgColor: "#FCEBEB" },
};

export default function BulkUpload({ onPipelineStart, onPipelineComplete }) {
  const [uploadState, setUploadState] = useState("idle");
  const [uploadedTotal, setUploadedTotal] = useState(0);
  const [fileName, setFileName] = useState("");
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepStatuses, setStepStatuses] = useState([
    "Waiting",
    "Waiting",
    "Waiting",
    "Waiting",
  ]);
  const [stepProgress, setStepProgress] = useState([0, 0, 0, 0]);
  const [results, setResults] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [totalClassified, setTotalClassified] = useState(0);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const STEP_RUNNING_LABELS = [
    "Uploading to HDFS...",
    "MapReduce running...",
    "Reading MR output...",
    "Classifying emails...",
  ];
  const STEP_DONE_LABELS = [
    "Stored in HDFS",
    "Preprocessing done",
    "Output ready",
    "Classification done",
  ];

  const resetState = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    setUploadState("idle");
    setFileName("");
    setCurrentStep(-1);
    setStepStatuses(["Waiting", "Waiting", "Waiting", "Waiting"]);
    setStepProgress([0, 0, 0, 0]);
    setResults(null);
    setJobId(null);
    setTotalClassified(0);
    setUploadedTotal(0);
    setIsDragging(false);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const animateResults = (finalCounts) => {
    const categories = ["Primary", "Promotions", "Social", "Spam"];
    setResults({ Primary: 0, Promotions: 0, Social: 0, Spam: 0 });
    let total = 0;
    categories.forEach((cat) => {
      const target = finalCounts[cat] || 0;
      total += target;
      if (target === 0) return;
      let count = 0;
      const iv = setInterval(() => {
        count = Math.min(count + Math.ceil(target / 40), target);
        setResults((prev) => ({ ...prev, [cat]: count }));
        if (count >= target) clearInterval(iv);
      }, 40);
    });
    setTotalClassified(total);
  };

  const pollPipelineStatus = useCallback(
    (id) => {
      // Clear any existing poll
      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/pipeline/${id}`);
          const data = await res.json();
          if (!data || data.error === "Job not found") return;

          // Update step statuses
          if (data.steps) {
            data.steps.forEach((step, idx) => {
              setStepStatuses((prev) => {
                const n = [...prev];
                n[idx] =
                  step.status === "done"
                    ? STEP_DONE_LABELS[idx]
                    : step.status === "running"
                      ? STEP_RUNNING_LABELS[idx]
                      : "Waiting";
                return n;
              });
              setStepProgress((prev) => {
                const n = [...prev];
                n[idx] = step.progress;
                return n;
              });
            });
            setCurrentStep(data.current_step);
          }

          if (data.status === "done") {
            clearInterval(pollRef.current);
            pollRef.current = null;

            if (data.total_input) setUploadedTotal(data.total_input);

            setStepStatuses([
              "Stored in HDFS",
              "Preprocessing done",
              "Output ready",
              "Classification done",
            ]);
            setStepProgress([100, 100, 100, 100]);
            setCurrentStep(3);

            setTimeout(() => {
              setUploadState("complete");
              if (data.results) animateResults(data.results);
              if (onPipelineComplete) onPipelineComplete(id);
            }, 800);
          }

          // Handle error — stop polling, show message
          if (data.status === "error") {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setUploadState("error");
            setErrorMessage(data.error || "Pipeline failed");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    },
    [onPipelineComplete],
  );

  const processFile = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    // Count rows in CSV for skip stats
    // Reset first, then set new value
    setUploadedTotal(0);
    try {
      const text = await file.text();
      const rows = text.split("\n").filter((r) => r.trim()).length - 1;
      setUploadedTotal(rows);
    } catch (e) {
      setUploadedTotal(0);
    }

    setFileName(file.name);
    setUploadState("uploading");
    setCurrentStep(-1);
    setStepStatuses(["Waiting", "Waiting", "Waiting", "Waiting"]);
    setStepProgress([0, 0, 0, 0]);
    setResults(null);

    try {
      if (onPipelineStart) onPipelineStart();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/pipeline`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        alert(`Upload failed: ${data.error}`);
        setUploadState("idle");
        setFileName("");
        setUploadedTotal(0);
        return;
      }

      // Store total_input from Flask for skip stats
      if (data.total_input) {
        setUploadedTotal(data.total_input);
      }

      setJobId(data.job_id);
      setUploadState("processing");
      pollPipelineStatus(data.job_id);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadState("idle");
      alert("Upload failed. Make sure Flask is running on localhost:5000");
    }
  };

  // File input change
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadState === "idle") setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadState === "idle") setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploadState !== "idle") return;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleZoneClick = () => {
    if (uploadState === "idle") fileInputRef.current?.click();
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
          Upload your email dataset — MapReduce preprocesses, Naive Bayes
          classifies, MongoDB stores results
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={handleZoneClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-5 transition-all ${
          uploadState === "idle"
            ? isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-copy scale-[1.01]"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer"
            : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
        }`}
      >
        {uploadState === "idle" ? (
          <>
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all ${
                isDragging
                  ? "bg-blue-200 dark:bg-blue-800 scale-110"
                  : "bg-blue-100 dark:bg-blue-900/30"
              }`}
            >
              <Upload size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              {isDragging
                ? "Drop your CSV file here"
                : "Drop CSV file here or click to browse"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload your email dataset for batch classification via Hadoop
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
              <Database size={14} />
              <span>
                Required columns:{" "}
                <span className="font-mono font-semibold">subject</span>,{" "}
                <span className="font-mono font-semibold">body</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              {uploadState === "complete" ? (
                <CheckCircle2
                  size={32}
                  className="text-teal-600 dark:text-teal-400"
                />
              ) : (
                <FileText
                  size={32}
                  className="text-blue-600 dark:text-blue-400"
                />
              )}
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
              {fileName}
            </div>
            <div
              className={`inline-flex flex-col gap-1 px-4 py-2 rounded-lg text-sm font-semibold ${
                uploadState === "complete"
                  ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              }`}
            >
              {uploadState === "complete" ? (
                <>
                  <span>
                    ✓ {totalClassified.toLocaleString()} emails classified
                    successfully
                  </span>
                  {uploadedTotal > 0 && uploadedTotal !== totalClassified && (
                    <span className="text-xs font-normal opacity-80">
                      {uploadedTotal - totalClassified} emails skipped — too
                      short or unreadable after preprocessing
                    </span>
                  )}
                </>
              ) : (
                <span>⏳ Processing emails through Hadoop pipeline...</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Pipeline Status — shows real progress from Flask */}
      <AnimatePresence>
        {uploadState !== "idle" && (
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
      {/* Error State */}
      <AnimatePresence>
        {uploadState === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                  Pipeline Failed
                </p>
                <p className="text-xs text-red-600 dark:text-red-500">
                  {errorMessage}
                </p>
                <p className="text-xs text-red-500 dark:text-red-600 mt-1">
                  Make sure your CSV has "subject" and "body" columns with
                  sufficient text content.
                </p>
              </div>
            </div>
            <button
              onClick={resetState}
              className="mt-3 w-full px-4 py-2 text-xs font-semibold rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Results Stats — shows real counts from MongoDB */}
      <AnimatePresence>
        {uploadState === "complete" && results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-5"
          >
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              Classification Results
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {Object.entries(categoryConfig).map(([category, config]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:shadow-md transition-all"
                >
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{ color: config.color }}
                  >
                    {(results[category] || 0).toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {category}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Button */}
      {uploadState === "complete" && (
        <div className="text-center">
          <button
            onClick={resetState}
            className="px-6 py-3 text-sm font-semibold rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
          >
            Upload Another Dataset
          </button>
        </div>
      )}
    </div>
  );
}
