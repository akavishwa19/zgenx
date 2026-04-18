import { Config } from '../types/config';
import { spawn } from 'node:child_process';

async function manageDeps(options: Partial<Config>): Promise<void> {
  const { database, language, logger: loggerOption } = options;

  const deps = ['express', 'uuid', 'dotenv'];
  const devDeps = [];

  if (database === 'mysql') {
    deps.push('mysql2');
  } else if (database === 'mongodb') {
    deps.push('mongodb');
  }

  if (language === 'typescript') {
    devDeps.push('@types/express', '@types/node', 'ts-node');
  }

  if (loggerOption === 'yes') {
    deps.push('pino', 'pino-pretty');
  }

  await installDeps(deps, devDeps);
}

async function installDeps(deps: string[], devDeps: string[]): Promise<void> {
  const packageManager = 'npm';
  try {
    await installPackages(packageManager, deps);
    await installPackages(packageManager, devDeps, true);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error, error.message);
    } else {
      console.error(error, 'failed to install dependencies');
    }
    throw error;
  }
}

function installPackages(
  packageManager: string,
  deps: string[],
  isDevDep: boolean = false
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (deps.length === 0) {
      return resolve(0);
    }

    const installType = isDevDep ? ['i', '-D', ...deps] : ['i', ...deps];

    const install = spawn(packageManager, installType, {
      stdio: 'inherit'
    });

    install.on('error', (err: Error) => {
      reject(new Error(`failed to install dependencies: ${err.message}`));
    });

    install.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`installation failed with code: ${code}`));
      }
    });
  });
}

export { manageDeps };
