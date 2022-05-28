const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const chalk = require('chalk');

const log = require('./utils/log.js');
const formatNumber = require('./utils/format.js');

const transformers = require('./transformers/index.js');

const DATA_PATH = '../data/Export 2022-05-28-00-15.csv';

const OUTPUT_DIRECTORY = '../output';
const OUTPUT_FILE = 'Flight Path.kml';

main();

function main() {
  log('main', `Start reading ${chalk.blue.bold(DATA_PATH)}`);
  const rawData = fs.readFileSync(path.resolve(__dirname, DATA_PATH));
  
  log('main', `Parsing data of size ${formatNumber(rawData.length)} bytes`);
  const records = parse(rawData, {
    columns: true,
  });
  printSample(records);

  const kml = applyTransformers(records);

  const outputFile = path.resolve(__dirname, OUTPUT_DIRECTORY, OUTPUT_FILE);
  log('main', `Writing transformed KML (${formatNumber(kml.length)} bytes) to ${chalk.green.bold(outputFile)}`);
  try {
    fs.mkdirSync(path.resolve(__dirname, OUTPUT_DIRECTORY));
  } catch (_) {
  }
  fs.writeFileSync(outputFile, kml);

  log('main', 'Done');
}

function applyTransformers(dataset) {
  transformers.forEach((transformer) => {
    log('main', `Transforming with transformer ${transformer.name}`);

    if (Array.isArray(dataset)) {
      let hasRemoval = false;
      dataset.forEach((record, index, records) => {
        if (transformer.transformEach) {
          // Visit each data point for transforming, and mark data points for later removal
          const transformed = transformer.transformEach(record, index, records);
          if (transformed) {
            records[index] = transformed;
          } else {
            hasRemoval = true;
            record._markedForRemoval = true;
          }
        }
      });

      // Remove marked data points
      if (hasRemoval) {
        const before = dataset.length;
        dataset = dataset.filter((record) => !record._markedForRemoval);
        const after = dataset.length;
        log(transformer.name, `Removed ${formatNumber(before - after)} data points`);
      }
    }

    // Transforme the whole dataset
    if (transformer.transform) {
      dataset = transformer.transform(dataset);
    }

    printSample(dataset);
  });
  return dataset;
}

function printSample(dataset) {
  if (Array.isArray(dataset)) {
    const n = dataset.length;
    if (n) {
      const sampleIndex = Math.floor(Math.random() * n);
      log('main', `Data with ${formatNumber(n)} data points, sample (#${sampleIndex})`, dataset[sampleIndex]);
    } else {
      log('main', 'Empty dataset');
    }
  } else {
    log('main', `Transformed: ${dataset.slice(0, 256)} ...`);
  }
}
