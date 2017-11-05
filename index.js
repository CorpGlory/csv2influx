#! /usr/bin/env node

const config = require('./config');
const importer = require('./importer');
const progress = require('progress');

const usage = `
Usage:
  csv2influx init                                         Creates template config file
  csv2influx [--config path/to/config.json] data.csv      Loads config from path/to/config.json then imports file data.csv to your influx
                                                          Default path: ./csv2influx.conf.json
`

switch(process.argv.length)
{
    case 3:
        if(process.argv[2] === 'init') {
          config.initConfig();
          process.exit(0);
        }
        else {
          var conf = config.loadConfig();
          var isQuiet = process.argv.indexOf('-q') >= 0;
          // consider process.argv[2] as csv-filename
          var inputFile = process.argv[2];
          var progressBar = undefined;
        }
        
    case 5:
    case 6:
        if(process.argv[2] === '--config') {
            // consider process.argv[3] as config-filename
            var conf = config.loadConfig(process.argv[3]);
            var isQuiet = process.argv.indexOf('-q') >= 0;
            // consider process.argv[4] as csv-filename
            var inputFile = process.argv[4];
            var progressBar = undefined;
            
            break;
        }

    default:
        console.log(usage);
        process.exit(0);
}

if (isQuiet) {
  importer.countFileLines(inputFile)
    .then(linesCount => {
      console.log('lines count:' + linesCount);
      progressBar = new progress(':current/:total (:percent) :bar ', { 
        width: 100, 
        total: linesCount
      });
      var imp = new importer.Importer(conf, inputFile, progressBar);
      imp.run()
        .then(() => console.log(''))
        .catch(err => {
          progressBar.terminate();
          console.error(err);
          process.exit(1);
        });
    });
} else {
  var imp = new importer.Importer(conf, inputFile, progressBar);
  imp.run()
    .then(() => console.log(''))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}


