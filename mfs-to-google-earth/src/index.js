const { program } = require('commander');
const chalk = require('chalk');

const { selectAndReadInput, writeOutput } = require('./io.js');
const parse = require('./parse.js');
const transformers = require('./transformers/index.js');
const log = require('./utils/log.js');
const formatNumber = require('./utils/format.js');

main();

async function main() {
  program
    .option('-i, --input <string>', 'input directory')
    .option('-o, --output <string>', 'output directory')
    .parse();
  const options = program.opts();

  const inputs = await selectAndReadInput(options);
  inputs.forEach(({ inputFile, rawData }) => {
    console.log('----');
    log('main', `Parsing ${chalk.blue.bold(inputFile)} data of size ${formatNumber(rawData.length)} bytes`);
    const records = parse(rawData);

    const kml = applyTransformers(records);

    // Output file shares the same name with its corresponding input
    writeOutput(options.output, inputFile, kml);
  });

  console.log(`----\n${chalk.green.bold('Done')}`);
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
        log(transformer.name, `Removed ${formatNumber(before - after)} data points (${before} -> ${after})`);
      }
    }

    // Transforme the whole dataset
    if (transformer.transform) {
      dataset = transformer.transform(dataset);
    }
  });
  return dataset;
}
