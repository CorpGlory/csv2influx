#! /usr/bin/env node

const minimist = require('minimist');
const config = require('./config');
const importer = require('./importer');

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
    var imp = new importer.Importer(conf);
    imp.run(args._[0], args.quiet)
      .then(() => console.log(''));
  }
} else {
  console.log(usage);
  process.exit(0);
}
