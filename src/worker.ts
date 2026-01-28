import { Worker, Job } from 'bullmq';
import { config } from './config';
import { analyzeResume, ResumeAnalysisInput } from './processor';
import { sendWebhook } from './utils/webhook';
import IORedis from 'ioredis';

interface JobData {
  jobId: string;
  resumeText: string;
  jobDescription?: string;
}

console.log('🚀 Starting Resume Analysis Worker...');
console.log(`📡 Connecting to Redis at ${config.redis.host}:${config.redis.port}`);
console.log(`📋 Listening on queue: ${config.queue.name}`);

const connection = config.redis.url
  ? new IORedis(config.redis.url, { maxRetriesPerRequest: null })
  : new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    username: config.redis.username,
    tls: config.redis.tls ? {} : undefined,
    maxRetriesPerRequest: null,
  });

const worker = new Worker<JobData>(
  config.queue.name,
  async (job: Job<JobData>) => {
    console.log(`\n📥 Received job: ${job.id} (jobId: ${job.data.jobId})`);

    try {
      const input: ResumeAnalysisInput = {
        resumeText: job.data.resumeText,
        jobDescription: job.data.jobDescription,
      };

      console.log(`🔍 Processing resume analysis...`);
      const result = await analyzeResume(input);
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
      console.error(`❌ Job ${job.data.jobId} failed:`, errorMessage);

      // Notify backend of failure
      await sendWebhook({
        jobId: job.data.jobId,
        status: 'failed',
        error: errorMessage,
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

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
