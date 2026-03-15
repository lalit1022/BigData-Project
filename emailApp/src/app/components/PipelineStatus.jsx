import { motion } from 'motion/react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

const steps = [
  { id: 0, name: 'HDFS Upload', color: '#185FA5', bgColor: '#E6F1FB' },
  { id: 1, name: 'MapReduce', color: '#854F0B', bgColor: '#FAEEDA' },
  { id: 2, name: 'Vectorization', color: '#0F6E56', bgColor: '#E1F5EE' },
  { id: 3, name: 'Mahout NB', color: '#534AB7', bgColor: '#EEEDFE' }
];

export default function PipelineStatus({ currentStep, stepStatuses, stepProgress }) {
  return (
    <div className="pipeline-steps grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {steps.map((step) => {
        const status = stepStatuses[step.id] || 'Waiting';
        const progress = stepProgress[step.id] || 0;
        const isActive = currentStep === step.id;
        const isComplete = currentStep > step.id;
        const isPending = currentStep < step.id;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.id * 0.1 }}
            className="step-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center"
          >
            {/* Step Icon */}
            <div
              className="step-icon w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-semibold"
              style={{
                backgroundColor: step.bgColor,
                color: step.color
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
            <div className="step-name text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {step.name}
            </div>

            {/* Step Status */}
            <div className="step-status text-[10px] text-gray-500 dark:text-gray-400 mb-2">
              {status}
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-wrap bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
              <motion.div
                className="progress-bar h-1 rounded-full"
                style={{ backgroundColor: step.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
