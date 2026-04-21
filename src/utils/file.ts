import path from 'node:path';
import fs from 'fs';

function getRoot(): string {
  return process.cwd();
}

function getCliRoot(): string {
  const dirName = __dirname;
  return buildPath(dirName, '..', '..');
}

function buildPath(...paths: string[]): string {
  return path.join(...paths);
}

function isFilePresent(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    return true;
  }
  return false;
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
    console.error(error, 'failed to read path at ' + filePath);
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
    console.error(error, 'failed to write path at ' + filePath);
    throw error;
  }
}

function readAsJson(filePath: string): object {
  const rawstring = readFile(filePath);
  try {
    return JSON.parse(rawstring);
  } catch (error) {
    console.error(error, 'failed to parse path at ' + filePath);
    throw error;
  }
}

function saveAsJson(filePath: string, data: unknown): void {
  const jsonData = JSON.stringify(data, null, 2);
  writeFile(filePath, jsonData);
}

export {
  getRoot,
  getCliRoot,
  buildPath,
  isFilePresent,
  ensureDirectory,
  readFile,
  writeFile,
  readAsJson,
  saveAsJson
};
