#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');

const { selectAndReadInput, writeOutput, cleanUpInput } = require('./io.js');
const parse = require('./parse.js');
const transformers = require('./transformers/index.js');
const log = require('./utils/log.js');
const formatNumber = require('./utils/format.js');

const DEFAULT_INPUT_DIRECTORY = '../data';
const DEFAULT_OUTPUT_DIRECTORY = '../output';

main();

async function main() {
  program
    .option('-i, --input <string>', 'input directory', DEFAULT_INPUT_DIRECTORY)
    .option('-o, --output <string>', 'output directory', DEFAULT_OUTPUT_DIRECTORY)
    .option('-c, --clean', 'clean input file when done', false)
    .parse();
  const options = program.opts();

  const inputs = await selectAndReadInput(options);
  inputs.forEach(({ inputFile, rawData }) => {
    console.log('----');
    log('main', `Parsing ${chalk.blue.bold(inputFile)} data of size ${formatNumber(rawData.length)} bytes`);
    const input = { meta: { inputFile }, dataset: parse(rawData) };

    const { dataset: kml } = applyTransformers(input);

    // Output file shares the same name with its corresponding input
    writeOutput(options.output, inputFile, kml);
    if (options.clean) {
      cleanUpInput(options.input, inputFile);
    }
  });

  console.log(`----\n${chalk.green.bold('Done')}`);
}

function applyTransformers(input) {
  const { meta, dataset } = input;

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
        const datasetAfterRemoval = dataset.filter((record) => !record._markedForRemoval);
        const after = datasetAfterRemoval.length;
        log(transformer.name, `Removed ${formatNumber(before - after)} data points (${before} -> ${after})`);
        input = { meta, dataset: datasetAfterRemoval };
      }
    }

    // Transforme the whole dataset
    if (transformer.transform) {
      input = transformer.transform(input);
    }
  });
  return input;
}
