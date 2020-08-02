#! /usr/bin/env node
const config = require('./config');
const importer = require('./importer');

const minimist = require('minimist');
const progress = require('progress');
const fs = require('fs');


const TXT_USAGE = `
Usage:
  csv2influx init                     Creates template config file
  csv2influx [options] data.csv       Imports file data.csv to your influxDB

Options:
  -c, --config /path/to/config.json   [optional] Specifies path to your config file.
                                      Default: ./csv2influx.conf.json
  -q, --quiet                         [optional] Makes output quiet (progress bar instead of written to DB values)
`


var args = minimist(process.argv.slice(2), {
  string: ['config'],
  boolean: ['quiet'],
  alias: { q: 'quiet', c: 'config' },
  default: {
    config: 'csv2influx.conf.json'
  }
});

if(args._.length > 0) {
  if(args._[0] === 'init') {
    config.initConfig();
    process.exit(0);
  } else {
    var conf = config.loadConfig(args.config);
    var inputFile = args._[0];
    var progressBar = undefined;

    if (!fs.existsSync(inputFile)) {
      console.error(`${inputFile} doesn't exist. Can't continue.`);
      process.exit(1);
    }
    
    // TODO: make it possible to run the script without cutting lines
    // TODO: maybe count progress by size of the file and current offset in the file
    importer.countFileLines(inputFile)
      .then(linesCount => {
        console.log('lines count:' + linesCount);
        if(args.quiet) {
          progressBar = new progress(':current/:total (:percent) :bar ', {
            width: 100,
            total: linesCount
          });
        }

        // TODO: don't put progressBar, but create an iterator
        var imp = new importer.Importer(conf, inputFile, progressBar);
        imp.run()
          .then(() => console.log(''))
          .catch(err => {
            if(progressBar) {
              progressBar.terminate();
            }
            console.error(err);
            process.exit(1);
          });
      })
      .catch(err => console.error(err));
  }
} else {
  console.log(TXT_USAGE);
  process.exit(0);
}
