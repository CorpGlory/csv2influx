## Air Quality
Based on https://archive.ics.uci.edu/ml/datasets/Air+quality.
First two columns merged to one.

The folder contains [air-quality.csv](air-quality.csv) and [air-quality.conf.json](air-quality.conf.json) for it.
Examples demonstrates how to take subset of all fields from csv file. Also `;` delimeter is used.

See next example to learn how to merge Date/Time


### Run

```
csv2influx --config air-quality.conf.json air-quality.csv
```

## Traffic Violations

Based on https://catalog.data.gov/dataset/traffic-violations-56dda (top 10 rows)


If you have date and time in separate fields in csv, like:

```
Date Of Stop,Time Of Stop, ...
08/28/2017,23:41:00, ...
```

You can merge fields `Date Of Stop` and `Time Of Stop` map to one `time` field.
So you can put `"from": ["Date Of Stop", "Time Of Stop"],` to merge columns into one separated by space.

Also, you can merge any field or tag using template-string-like syntax. 
Let's say you have a csv file with columns `Latitude` and `Longitude`, but in the you want to merge
these columns into one using format `"${Latitude},${Longitude}"`:

[traffic-violations.conf.json](traffic-violations.conf.json):
```javascript
{
  // ...
  "mapping": {
    "time": {
      // fields "Date of Stop" and "Time of Stop" will be concatenated to create timestamp
      "from": ["Date Of Stop", "Time Of Stop"],
      "type": "timestamp",
      "format": "jsDate"
    },
    "fieldSchema": {
      "coordinates": {
        // fields "Latitude" and "Longitude" will be concatenated 
        // with "," delimiter to create "coordinates" field
        "from": "${Latitude},${Longitude}",  // see /src/template.js for more info
        "type": "string"
      }
    },
    "tagSchema": {
      "agency": {
        "from": "Agency",
        "type": "*"
      }
    }
  }
  // ...
}

```

This example is based on [github comment](https://github.com/CorpGlory/csv2influx/issues/28#issuecomment-335570628)

### Run

```
csv2influx --config traffic-violations.conf.json traffic-violations.csv
```
