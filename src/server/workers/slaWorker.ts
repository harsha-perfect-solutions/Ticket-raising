import cron from 'node-cron';
import { checkAndProcessSlaBreaches } from '../services/slaService';

export function startSlaMonitoringWorker() {
  console.log('⏰ SLA Monitoring Background Worker initiated (runs every 30 seconds)');

  // Run immediately on startup
  checkAndProcessSlaBreaches().catch((err) => {
    console.error('Error during initial SLA breach check:', err);
  });

  // Schedule task every 30 seconds
  const task = cron.schedule('*/30 * * * * *', async () => {
    try {
      const stats = await checkAndProcessSlaBreaches();
      if (stats.warnedCount > 0 || stats.breachedCount > 0 || stats.escalatedCount > 0) {
        console.log(
          `⏱️ SLA Check Report: Checked ${stats.checkedCount} | Warned: ${stats.warnedCount} | Breached: ${stats.breachedCount} | Escalated: ${stats.escalatedCount}`
        );
      }
    } catch (err) {
      console.error('Error in SLA background worker run:', err);
    }
  });

  return task;
}
