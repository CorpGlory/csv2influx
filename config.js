const errors = require('./errors');
const fs = require('fs');

const INIT_CONF_FILE_NAME = 'csv2influx.conf.json';

var config = {
  influxdbUrl: 'http://127.0.0.1:8086/INFLUXDB_URL',
  measurementName: 'MEASUREMENT_NAME',
  mapping: {
    time: {
      from: 'date',
      type: 'timestamp',
      format: 'jsDate'
    },
    fieldSchema: {
      lat: {
        from: 'lat',
        type: 'float'
      },
      lng: {
        from: 'lng',
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
      location: {
        from: 'location',
        type: 'string'
      },
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

function loadConfig(config_file_name) {
  config_file_name = typeof config_file_name  !== 'undefined' ? config_file_name : INIT_CONF_FILE_NAME;

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
  loadConfig,
  
  // only for testing
  
  _checkConfigObject
}
