import renderTemplate from './renderTemplate';
import { writeFile, readFile } from './file';
import { Config } from '../types/config';

async function buildTemplate(
  inputPath: string,
  outputPath: string,
  options?: Partial<Config>
) {
  const inputData = readFile(inputPath);
  const outputData = renderTemplate(inputData, options);
  writeFile(outputPath, outputData);
}

export default buildTemplate;
