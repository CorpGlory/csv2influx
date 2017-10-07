const errors = require('./errors');
const fs = require('fs');

const INIT_CONF_FILE_NAME = 'csv2influx.conf.json';

var config = {
  influxdbUrl: "http://127.0.0.1:8086/INFLUXDB_URL",
  measurementName: "MEASUREMENT_NAME",
  mapping: {
    timestamp: "date",
    fieldSchema: {
      date: {
        "format": "jsDate"
      },
      lat: 'float',
      lng: 'float',
      name: 'string',
      description: 'string',
      location: 'string',
    },
  },
  csv: {
    delimiter: ','
  }
}

function initConfig() {
  console.log('Writing ' + INIT_CONF_FILE_NAME);
  fs.writeFileSync(INIT_CONF_FILE_NAME, JSON.stringify(config, null, 2));
  console.log('ok');
}

function _checkConfigObject(confObj) {
  if(!confObj.measurementName) {
    return 'no measurementName field';
  }
  if(!confObj.influxdbUrl) {
    return 'no influxdbUrl field';
  }
  if(!confObj.mapping) {
    return 'no mapping';
  }
  if(!confObj.mapping.fieldSchema) {
    return 'mapping.fieldSchema';
  }
  if(!confObj.mapping.timestamp) {
    return 'mapping.timestamp';
  }
  if(confObj.mapping.fieldSchema[confObj.mapping.timestamp] === undefined) {
    return "mapping.fieldSchema should contain '" + confObj.mapping.timestamp + "' field";
  }
  return undefined;
}

function loadConfig(config_file_name) {
  console.log('Reading ' + config_file_name);
  if(!fs.existsSync(config_file_name)) {
    console.error(config_file_name + ' doesn`t exist. Can`t continue.');
    console.error('csv2influx init      to create template config')
    process.exit(errors.ERROR_BAD_CONFIG_FILE);
  }
  var str = fs.readFileSync(config_file_name).toString();
  var confObj = JSON.parse(str);
  console.log('ok');
  console.log('checking format');
  var checkErr = _checkConfigObject(confObj);
  if(checkErr !== undefined) {
    console.log('Config format error: ' + checkErr);
    process.exit(errors.ERROR_BAD_CONFIG_FORMAT);
  }
  console.log('ok');
  return confObj;
}

module.exports = {
  initConfig,
  loadConfig
}