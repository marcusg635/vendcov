import React from 'react';
import ManualJobForm from '@/components/postjob/ManualJobForm';

/**
 * MANUAL-ONLY JOB POSTING
 * AI removed entirely to prevent loops, crashes, and repeated questions
 */
export default function AIQuestionsStep({ jobData, updateJobData, onNext }) {
  return (
    <ManualJobForm
      jobData={jobData}
      initialData={jobData}
      updateJobData={updateJobData}
      onNext={onNext}
      onBack={null}
    />
  );
}

