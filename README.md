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
  influxdbUrl: "http://127.0.0.1:8086/INFLUXDB", // INFLUXDB database has to exists
  measurementName: "MEASUREMENT_NAME",
  mapping: {
    timestamp: "date",
    fieldSchema: {
      date: {
        "format": "jsDate" // something what js can parse as string
      },
      lat: 'float',
      lng: 'float',
      mMeasure: {
        name: 'title',    // renaming fields available: mMeasure -> name
        type: 'string'
      },
      description: 'string',
      location: 'string'
    },
  },
  csv: {
    delimiter: ','
  }
}

```

