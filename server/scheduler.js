const cron = require('node-cron');
const notifyThirstyPlants = require('./jobs/notifyThirstyPlants');

// Runs every day at 10:00 AM server local time
cron.schedule('0 10 * * *', () => {
  notifyThirstyPlants();
});

console.log('[Scheduler] Daily 10:00 AM notification job registered');
