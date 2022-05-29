const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const log = require('./utils/log.js');
const formatNumber = require('./utils/format.js');

const DEFAULT_INPUT_DIRECTORY = '../data';
const DEFAULT_OUTPUT_DIRECTORY = '../output';

const INPUT_EXTENSION = '.csv';
const OUTPUT_EXTENSION = '.kml';

module.exports = {
  selectAndReadInput,
  writeOutput,
}

async function selectAndReadInput(options) {
  const inputRelative = options.input || DEFAULT_INPUT_DIRECTORY;
  const inputDirectory = path.resolve(__dirname, inputRelative);

  if (!fs.existsSync(inputDirectory)) {
    log('main', `Input directory ${chalk.yellow.bold(inputDirectory)} does NOT exist`);
    process.exit(1);
  }

  const inputFiles = fs
    .readdirSync(inputDirectory)
    .filter((file) => file.endsWith('.csv'));
  if (!inputFiles.length) {
    log('main', `Input directory ${chalk.yellow.bold(inputDirectory)} is does not contain "*.csv" files`);
    process.exit(1);
  }

  const inputInfos = inputFiles.map((inputFile) => {
    const { outputPath } = _outputPath(options.output || DEFAULT_OUTPUT_DIRECTORY, inputFile);
    return {
      inputFile,
      hasOutput: fs.existsSync(outputPath),
    };
  });

  const { selectedInputs } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedInputs',
    message: 'Select input file(s)',

    // Select files that has no corresponding output yet by default
    default: inputInfos.filter((inputInfo) => !inputInfo.hasOutput).map((inputInfo) => inputInfo.inputFile),

    when() {
      return inputInfos.length;
    },
    choices() {
      return inputInfos.map((inputInfo) => inputInfo.inputFile);
    },
  }]);

  if (!selectedInputs.length) {
    log('main', `No input to process`);
  }

  return selectedInputs.map((inputFile) => {
    log('main', `Start reading ${chalk.blue.bold(inputFile)}`);
    return {
      inputFile,
      rawData: fs.readFileSync(path.resolve(inputDirectory, inputFile), {
        encoding: 'utf-8',
      }),
    };
  });
};

function writeOutput(outputDirectory, correspondingInput, kml) {
  const { outputDirectoryRelative, outputPath } = _outputPath(outputDirectory, correspondingInput);

  log('main', `Writing transformed KML (${formatNumber(kml.length)} bytes) to ${chalk.green.bold(outputPath)}`);
  try {
    fs.mkdirSync(path.resolve(__dirname, outputDirectoryRelative));
  } catch (_) {
  }
  fs.writeFileSync(outputPath, kml);
}

function _outputPath(outputDirectory, correspondingInput) {
  const outputDirectoryRelative = outputDirectory || DEFAULT_OUTPUT_DIRECTORY;
  const outputFileName = correspondingInput.replace(INPUT_EXTENSION, OUTPUT_EXTENSION);
  const outputPath = path.resolve(__dirname, outputDirectoryRelative, outputFileName);

  return { outputDirectoryRelative, outputPath };
}
