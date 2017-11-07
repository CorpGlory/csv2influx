#! /usr/bin/env node

const minimist = require('minimist');
const config = require('./config');
const importer = require('./importer');
const progress = require('progress');
const minimist = require('minimist')

const usage = `
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

    importer.countFileLines(inputFile)
      .then(linesCount => {
        console.log('lines count:' + linesCount);
        if(args.quiet) {
          progressBar = new progress(':current/:total (:percent) :bar ', {
            width: 100,
            total: linesCount
          });
        }

        var imp = new importer.Importer(conf, inputFile, progressBar)
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
  console.log(usage);
  process.exit(0);
}
