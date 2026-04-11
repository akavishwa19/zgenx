import { Config } from '../types/config';
import { CONFIG_FILE_NAME } from '../consts';
import { buildPath, getRoot, readFile, saveAsJson } from './file';

async function readConfig() {
  const root = getRoot();
  const filePath = buildPath(root, CONFIG_FILE_NAME);
  const data = readFile(filePath);
  return JSON.parse(data) as Config;
}

async function saveConfig(data: Config): Promise<void> {
  if (!data) {
    throw new Error('invalid data to write file');
  }

  const root = getRoot();
  const savePath = buildPath(root, CONFIG_FILE_NAME);
  saveAsJson(savePath, data);
}

export { readConfig, saveConfig };
