const config = require('./config');
const Importer = require('./importer');

console.log(process.argv.join('\n'));

if(process.argv[2] === 'init') {
  config.initConfig();
  process.exit(0);
}

var conf = config.loadConfig();

console.log(conf.shamaName);