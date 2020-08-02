const errors = require('./errors');
const fs = require('fs');


const DEFAULT_CONF_FILE_NAME = 'csv2influx.conf.json';
const INIT_CONFIG = {
  influxdbUri: 'http://127.0.0.1:8086/database-name',
  measurementName: 'measurment-name',
  mapping: {
    time: {
      from: 'date',
      type: 'timestamp',
      format: 'jsDate'
    },
    fieldSchema: {
      lng: {
        from: 'some-value',
        type: 'float'
      },
      name: {
        from: 'name',
        type: 'string'
      },
      descr: {
        from: 'description',
        type: 'string'
      },
    },
  },
  csv: {
    delimiter: ','
  }
}

function initConfig() {
  console.log('Writing ' + DEFAULT_CONF_FILE_NAME);
  fs.writeFileSync(DEFAULT_CONF_FILE_NAME, JSON.stringify(INIT_CONFIG, null, 2));
  console.log('ok');
}

function _checkConfigObject(confObj) {
  if(!confObj.measurementName) {
    return 'no measurementName field';
  }
  if(!(confObj.influxdbUri || confObj.influxdbUrl)) {
    return 'no influxdbUri field';
  }
  if(!confObj.mapping) {
    return 'no mapping field';
  }
  if(!confObj.mapping.fieldSchema) {
    return 'no fieldSchema specified';
  }
  if(!confObj.mapping.time) {
    console.log(`WARNING: you didn't set time field, importing rows with current time`);
  } else {
    if(!confObj.mapping.time.format) {
      return 'no format specified for time';
    }
  }
  return undefined;
}

function _ensureInfluxUri(confObj) {
  if(confObj.influxdbUri === undefined) {
    console.log('Trying influxdbUrl instead of influxdbUri');
    console.log(confObj.influxdbUrl);
    confObj.influxdbUri = confObj.influxdbUrl;
  }
}

function loadConfig(configFilename) {
  configFilename = configFilename !== undefined ? configFilename : DEFAULT_CONF_FILE_NAME;

  console.log('Reading ' + configFilename);
  if(!fs.existsSync(configFilename)) {
    console.error(configFilename + ' doesn`t exist. Can`t continue.');
    console.error('csv2influx init      to create template config')
    process.exit(errors.ERROR_BAD_CONFIG_FILE);
  }
  var str = fs.readFileSync(configFilename).toString();
  var confObj = JSON.parse(str);
  console.log('ok');
  console.log('checking format');
  var checkErr = _checkConfigObject(confObj);
  if(checkErr !== undefined) {
    console.log('Config format error: ' + checkErr);
    process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
  }
  _ensureInfluxUri(confObj);
  console.log('ok');
  return confObj;
}

module.exports = {
  initConfig,
  loadConfig,
  
  // only for testing
  _checkConfigObject
}
