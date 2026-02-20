import { Queue } from 'bullmq';
import { config, getRedisConnection } from './config';

/**
 * A simple script to push a mock job to the Redis queue for testing the AI worker.
 */
async function testProducer() {
  console.log(`🚀 Connecting to Redis...`);

  const myQueue = new Queue(config.queue.name, { connection: getRedisConnection() });

  const mockJobData = {
    jobId: 'test-job-' + Date.now(),
    resumeText: `
      John Doe
      Software Engineer
      Skills: TypeScript, Node.js, React, AWS.
      Experience: 5 years at Tech Corp building scalable web applications.
    `,
    jobDescription: `
      We are looking for a Senior Software Engineer with strong experience in Node.js and TypeScript.
      Knowledge of cloud services like AWS is a plus.
    `,
  };

  console.log(`📦 Enqueueing mock job: ${mockJobData.jobId}`);

  await myQueue.add('analyze', mockJobData);

  console.log('✅ Job added successfully!');
  process.exit(0);
}

testProducer().catch((err) => {
  console.error('❌ Failed to add job:', err);
  process.exit(1);
});
