import path from 'node:path';
import fs from 'fs';
import logger from './logger';

function getRoot(): string {
  return process.cwd();
}

function buildPath(...paths: string[]): string {
  return path.join(...paths);
}

function ensureDirectory(dirPath: string): void {
  if (!dirPath) {
    throw new Error('path is required to ensure directory');
  }
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readFile(filePath: string): string {
  if (!filePath) {
    throw new Error('path is required to read file');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('file is missing at specified path');
  }

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data;
  } catch (error) {
    logger.error(error, 'failed to read path at ' + filePath);
    throw error;
  }
}

function writeFile(filePath: string, data: string): void {
  if (!filePath || !data) {
    throw new Error('path and data is required to write file');
  }
  const dirPath = path.dirname(filePath);
  ensureDirectory(dirPath);
  try {
    fs.writeFileSync(filePath, data, 'utf-8');
  } catch (error) {
    logger.error(error, 'failed to write path at ' + filePath);
    throw error;
  }
}

function readAsJson(filePath: string): object {
  const rawstring = readFile(filePath);
  try {
    return JSON.parse(rawstring);
  } catch (error) {
    logger.error(error, 'failed to parse path at ' + filePath);
    throw error;
  }
}

function saveAsJson(filePath: string, data: unknown): void {
  const jsonData = JSON.stringify(data, null, 2);
  writeFile(filePath, jsonData);
}

export {
  getRoot,
  buildPath,
  ensureDirectory,
  readFile,
  writeFile,
  readAsJson,
  saveAsJson
};
