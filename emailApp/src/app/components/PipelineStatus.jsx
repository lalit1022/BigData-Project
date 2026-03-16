import { motion } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const steps = [
  { id: 0, name: 'HDFS Upload',   color: '#185FA5', bgColor: '#E6F1FB' },
  { id: 1, name: 'MapReduce',     color: '#854F0B', bgColor: '#FAEEDA' },
  { id: 2, name: 'Vectorization', color: '#0F6E56', bgColor: '#E1F5EE' },
  { id: 3, name: 'Mahout NB',     color: '#534AB7', bgColor: '#EEEDFE' }
];

const DONE_LABELS = [
  'Stored in HDFS',
  'Preprocessing done',
  'Output ready',
  'Classification done'
];

export default function PipelineStatus({ currentStep, stepStatuses, stepProgress }) {
  return (
    <div className="pipeline-steps grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {steps.map((step) => {
        const progress  = stepProgress[step.id] || 0;
        const status    = stepStatuses[step.id]  || 'Waiting';

        // Derive state from progress + status directly
        // not from currentStep position comparison
        const isComplete = progress === 100 || status === DONE_LABELS[step.id];
        const isActive   = !isComplete && currentStep === step.id && progress > 0;
        const isPending  = !isComplete && !isActive;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.id * 0.1 }}
            className={`step-card border rounded-lg p-3 text-center transition-all ${
              isComplete
                ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-800'
                : isActive
                ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Step Icon */}
            <div
              className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-semibold transition-all"
              style={{
                backgroundColor: isComplete ? '#E1F5EE' : step.bgColor,
                color:           isComplete ? '#0F6E56' : step.color
              }}
            >
              {isComplete ? (
                <CheckCircle2 size={18} />
              ) : isActive ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                step.id + 1
              )}
            </div>

            {/* Step Name */}
            <div className={`text-xs font-semibold mb-1 ${
              isComplete
                ? 'text-green-700 dark:text-green-400'
                : isActive
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {step.name}
            </div>

            {/* Step Status text */}
            <div className={`text-[10px] mb-2 ${
              isComplete
                ? 'text-green-600 dark:text-green-500'
                : isActive
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {status}
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor: isComplete ? '#0F6E56' : step.color
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </div>

            {/* Percentage */}
            {(isActive || isComplete) && (
              <div className={`text-[10px] mt-1 font-medium ${
                isComplete ? 'text-green-600 dark:text-green-500' : 'text-gray-400'
              }`}>
                {progress}%
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}