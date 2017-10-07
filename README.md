# csv2influx

A tool for converting csv file to influxdb database.
You map csv fields to influxdb columns in config file.

https://github.com/CorpGlory/csv2influx

## Install

```
npm install -g csv2influx
```

## Usage

```
csv2influx init                                       Creates template config file
csv2influx [--config path/to/config.json] data.csv    Loads config from path/to/config.json then imports file data.csv to your influx
                                                      Default path: ./csv2influx.conf.json
```

See [example](example) for more details.

## Config documentation

```javascript

{
  influxdbUrl: 'http://127.0.0.1:8086/INFLUXDB_URL',
  measurementName: 'MEASUREMENT_NAME',
  mapping: {
    fieldSchema: {
      date: {
        'from': 'date',
        'type': 'timestamp'
      },
      lat: {
        'from': 'lat',
        'type': 'float'
      },
      lng: {
        'from': 'lng',
        'type': 'float'
      },
      name: {
        'from': 'name',
        'type': 'string'
      },
      descr: { // renaming field available: description -> descr
        'from': 'description', 
        'type': 'string'
      },
      location: {
        'from': 'location',
        'type': 'string'
      },
    },
  },
  csv: {
    delimiter: ','
  }
}

```

