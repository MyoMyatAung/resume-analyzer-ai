import { Worker, Job, Queue } from 'bullmq';
import { config, getRedisConnection } from './config';
import { analyzeResume } from './processor';
import { generateContent } from './content-generator';
import { sendWebhook, sendAIContentWebhook } from './utils/webhook';

// Job data types
interface AnalysisJobData {
  jobId: string;
  resumeText: string;
  jobDescription?: string;
  type?: 'match' | 'quality';
}

interface ContentGenerationJobData {
  jobId: string;
  userId: string;
  type: 'generate-content';
  contentType:
  | 'generate-summary'
  | 'enhance-experience'
  | 'suggest-skills'
  | 'improve-achievements';
  data: any;
  context?: any;
}

type JobData = AnalysisJobData | ContentGenerationJobData;

function isContentGenerationJob(data: JobData): data is ContentGenerationJobData {
  return data.type === 'generate-content';
}

console.log('🚀 Starting Resume Analysis Worker...');
console.log(`📡 Connecting to Redis at ${config.redis.host}:${config.redis.port}`);
console.log(`📋 Listening on queue: ${config.queue.name}`);

const worker = new Worker<JobData>(
  config.queue.name,
  async (job: Job<JobData>) => {
    console.log(`\n📥 Received job: ${job.id} (jobId: ${job.data.jobId})`);

    // Check if this is a content generation job
    if (isContentGenerationJob(job.data)) {
      return await processContentGenerationJob(job as Job<ContentGenerationJobData>);
    }

    // Otherwise, process as analysis job (original behavior)
    return await processAnalysisJob(job as Job<AnalysisJobData>);
  },
  {
    connection: getRedisConnection(),
    concurrency: 2,
  }
);

/**
 * Process resume analysis job (original functionality)
 */
async function processAnalysisJob(job: Job<AnalysisJobData>) {
  try {

    console.log(`🔍 Processing resume analysis...`);
    const result = await analyzeResume(job.data.resumeText, job.data.jobDescription);

    console.log(`✅ Analysis complete for job ${job.data.jobId}`);

    // Notify backend of success
    await sendWebhook({
      jobId: job.data.jobId,
      status: 'success',
      result,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Analysis job ${job.data.jobId} failed:`, errorMessage);

    // Notify backend of failure
    await sendWebhook({
      jobId: job.data.jobId,
      status: 'failed',
      error: errorMessage,
    });

    throw error;
  }
}

/**
 * Process content generation job (new functionality for resume builder)
 */
async function processContentGenerationJob(job: Job<ContentGenerationJobData>) {
  const { jobId, userId, contentType, data, context } = job.data;

  try {
    console.log(`🎨 Processing content generation (${contentType})...`);
    const result = await generateContent({
      type: contentType as any,
      ...data,
      context
    });
    console.log(`✅ Content generation complete for job ${jobId}`);

    // Notify backend of success
    await sendAIContentWebhook({
      jobId,
      userId,
      contentType,
      status: 'success',
      result,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Content generation job ${jobId} failed:`, errorMessage);

    // Notify backend of failure
    await sendAIContentWebhook({
      jobId,
      userId,
      contentType,
      status: 'failed',
      error: errorMessage,
    });

    throw error;
  }
}

worker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`💥 Job ${job?.id} failed with error:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down worker...');
  await worker.close();
  process.exit(0);
});
