const cron = require('node-cron');
const { checkUpcomingDeadlines } = require('./notifications');

// Запускаем проверку дедлайнов каждый день в 9:00
const startScheduler = () => {
  // Проверка дедлайнов каждый день в 9:00
  cron.schedule('0 9 * * *', () => {
    console.log('Running deadline check...');
    checkUpcomingDeadlines();
  });

  console.log('Scheduler started: deadline checks at 9:00 AM daily');
};

module.exports = { startScheduler };
