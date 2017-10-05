const fs = require('fs');

const CONF_FILE_NAME = 'csv2influx.conf.json';

var config = {
  shamaName: "SHEMA_NAME",
  inputFile: "INPUT_FILE.csv",
  influxdbUrl: "http://127.0.0.1:8086/INFLUXDB_URL",
  fieldShema: {
    lat: 'float',
    lng: 'float',
    name: 'string',
    description: 'string',
    location: 'string'
  }
}

function initConfig() {
  console.log('Wriring ' + CONF_FILE_NAME);
  fs.writeFileSync(CONF_FILE_NAME, JSON.stringify(config, null, 2));
  console.log('ok');
}

function loadConfig() {
  console.log('Reading ' + CONF_FILE_NAME);
  var str = fs.readFileSync(CONF_FILE_NAME).toString();
  var confObj = JSON.parse(str);
  console.log('ok');
  return confObj;
}

module.exports = {
  initConfig,
  loadConfig
}