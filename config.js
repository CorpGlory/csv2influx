const errors = require('./errors');
const fs = require('fs');

const CONF_FILE_NAME = 'csv2influx.conf.json';

var config = {
  shemaName: "SHEMA_NAME",
  influxdbUrl: "http://127.0.0.1:8086/INFLUXDB_URL",
  mapping: {
    timestamp: "Date",
    fieldShema: {
      lat: 'float',
      lng: 'float',
      name: 'string',
      description: 'string',
      location: 'string'
    },
  },
  csv: {
    delimiter: ','
  }
}

function initConfig() {
  console.log('Wriring ' + CONF_FILE_NAME);
  fs.writeFileSync(CONF_FILE_NAME, JSON.stringify(config, null, 2));
  console.log('ok');
}

function _checkConfigObject(confObj) {
  if(!confObj.shemaName) {
    return 'no shemaName field';
  }
  if(!confObj.influxdbUrl) {
    return 'no influxdbUrl field';
  }
  if(!confObj.mapping) {
    return 'no mapping';
  }
  if(!confObj.mapping.fieldShema) {
    return 'mapping.fieldShema';
  }
  if(!confObj.mapping.timestamp) {
    return 'mapping.timestamp';
  }
  if(confObj.mapping.fieldShema[confObj.mapping.timestamp] === undefined) {
    return "mapping.fieldShema should contain '" + confObj.mapping.timestamp + "' field";
  }
  return undefined;
}

function loadConfig() {
  console.log('Reading ' + CONF_FILE_NAME);
  if(!fs.existsSync(CONF_FILE_NAME)) {
    console.error(CONF_FILE_NAME + ' doesn`t exist. Can`t continue.');
    console.error('csv2influx init      to create template config')
    process.exit(errors.ERROR_BAD_CONFIG);
  }
  var str = fs.readFileSync(CONF_FILE_NAME).toString();
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