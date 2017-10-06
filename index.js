#! /usr/bin/env node

const config = require('./config');
const importer = require('./importer');

const usage = `
Usage:
  csv2influx init        Creates template config file
  csv2influx data.csv    Loads config file from current directory
                         then imports file data.csv to your influx
`

if(process.argv.length < 3) {
  console.log(usage);
  process.exit(0);
}

if(process.argv[2] === 'init') {
  config.initConfig();
  process.exit(0);
}

var conf = config.loadConfig();
var imp = new importer.Importer(conf);
// consider process.argv[2] as filename
imp.run(process.argv[2]);

