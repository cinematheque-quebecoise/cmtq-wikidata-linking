const CronJob = require('cron').CronJob


module.exports = (app, wikidataLinkerService) => {
  var dailyLinkingJob = new CronJob({
    cronTime: '0 21 18 * * 1-5', // À 6h00, du lundi au vendredi.
    start: true,
    onTick: function() {
      var start = new Date()
      console.log('Executing daily data linking ...')
      wikidataLinkerService.linkData()
      return console.log("Executing daily data linking ... done. Took " + (new Date() - start) + " ms.")
    }
  })
  dailyLinkingJob.start()
}
