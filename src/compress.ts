import { Command } from 'commander';
import * as fs from 'fs-extra';
import winston from 'winston';
import { compress, decompress } from 'lz-string';

const program = new Command();

program
  .version('1.0.0')
  .description('A program to read integers from a CSV file and calculate their sum')
  .requiredOption('--file <path>', 'Path to integers file')
  .parse(process.argv);

const options = program.opts();

// // create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

function forwardDifferentialCoding(numbers: number[]): number[] {
  return numbers.reduce((acc: number[], curr: number, idx: number) => {
    if (idx === 0) {
      // keep first number as-is
      acc.push(curr);
    } else {
      // store difference from previous number
      acc.push(curr - numbers[idx - 1]); 
    }
    return acc;
  }, []);
}

function reverseDifferentialCoding(numbers: number[]): number[] {
  return numbers.reduce((acc: number[], curr: number, idx: number) => {
    if (idx === 0) {
      acc.push(curr);
    } else {
      acc.push(acc[idx - 1] + curr);
    }
    return acc;
  }, []);
}

function variableLengthEncode(num: number): number[] {
  const bytes: number[] = [];
  let value = Math.abs(num);

  // Add sign bit to first byte
  const signBit = num < 0 ? 1 : 0;

  // Handle first byte
  bytes.push((value & 0x3F) | (signBit << 7) | (value > 0x3F ? 0x40 : 0));
  value = value >> 6;

  // Add remaining bytes
  while (value > 0) {
    bytes.push((value & 0x7F) | (value > 0x7F ? 0x80 : 0));
    value = value >> 7;
  }

  return bytes;
}

async function processFile(filepath: string): Promise<void> {
  // read the file content
  const filecontent = await fs.readFile(filepath, 'utf-8');

  // split the content by comma and convert to numbers
  const numbers = filecontent
    .trim()
    .split(',')
    .map((num: string) => parseInt(num.trim(), 10));
  logger.info("Naive size", {size: btoa(numbers.toString()).length})
  
  // sort numbers in ascending order
  numbers.sort((a, b) => a - b);

  // apply differential coding - store differences between consecutive numbers
  const diffCoded = forwardDifferentialCoding(numbers);
  const varLenCoded = diffCoded.flatMap(variableLengthEncode);
  const compressedData = compress(varLenCoded.join(','));

  logger.info("Compressed size", {size: compressedData.length, ratio: compressedData.length / numbers.length});

  const decompressedData = decompress(compressedData);
  logger.info("Decoded numbers", {numbers: decompressedData});
}

// execute the program
processFile(options.file);