#! /usr/bin/env node

const config = require('./config');
const importer = require('./importer');

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
          var imp = new importer.Importer(conf);
          // consider process.argv[2] as csv-filename
          imp.run(process.argv[2]);

          break;
        }

    case 5:
        if(process.argv[2] === '--config') {
          // consider process.argv[3] as config-filename
          var conf = config.loadConfig(process.argv[3]);
          var imp = new importer.Importer(conf);
          // consider process.argv[4] as csv-filename
          imp.run(process.argv[4]);
          
          break;
        }

    default:
        console.log(usage);
        process.exit(0);
}


