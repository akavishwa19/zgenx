import { input, select } from '@inquirer/prompts';
import ora from 'ora';
import logger from '../utils/logger';
import { saveConfig } from '../utils/config';
import { Config, Fields } from '../types/config';
import { ACCEPTABLE_SCHEMA_TYPES } from '../consts';

async function defineConfig(): Promise<Config> {
  try {
    const spinner = ora();

    const config = {} as Config;

    config.language = await select({
      message: 'Select the language',
      choices: [
        { name: 'Javascript', value: 'javascript' },
        { name: 'Typescript', value: 'typescript' }
      ]
    });

    if (config.language === 'typescript') {
      config.type = 'esm';
      spinner.info('Using ESM as default for typescript');
    } else {
      config.type = await select({
        message: 'Select the module type',
        choices: [
          { name: 'Commonjs', value: 'commonjs' },
          { name: 'ESM', value: 'esm' }
        ]
      });
    }

    config.database = await select({
      message: 'Select the database',
      choices: [
        { name: 'Mysql', value: 'mysql' },
        { name: 'MongoDb', value: 'mongodb' }
      ]
    });

    config.docker = await select({
      message: 'Do you want to containerise your app',
      choices: [
        { name: 'Yes', value: 'yes' },
        { name: 'No', value: 'no' }
      ]
    });

    config.structure = await select({
      message: 'Select a setup for your folder',
      choices: [
        { name: 'BASIC: src-> routes-> controllers', value: 'basic' },
        {
          name: 'ADVANCED: src-> routes-> controllers-> services',
          value: 'advanced'
        }
      ]
    });

    const apis = await input({
      message: 'Enter the entities for your CRUD app [comma seperated]:',
      validate: (value: string) => {
        if (!value.trim()) {
          return 'Please anter at least one api entity name to create your endpoints';
        }
        return true;
      }
    });

    config.schemas = {};

    config.apis = apis
      .split(',')
      .map((item: string) => item.trim())
      .filter(Boolean);

    for (const api of config.apis) {
      const schemaInput = await input({
        message: `Enter fields for ${api} [comma seperated][eg: name:string, age:number]:`,
        // eslint-disable-next-line
        validate: (value: string) => {
          if (!value.trim()) {
            return 'value is required to generate API';
          }

          const fields = value.split(',').map((item: string) => item.trim());
          const seen = new Set();

          for (const entry of fields) {
            const parts = entry.split(':');
            if (parts.length !== 2) {
              return `invalid field "${entry}". Use format name:type`;
            }

            const [rawName, rawType] = parts;
            const name = rawName?.trim();
            const type = rawType?.trim();

            if (!name) {
              return `invalid name value exists for ${entry}`;
            }

            if (!type) {
              return `invalid type value exists for ${entry}`;
            }

            if (!ACCEPTABLE_SCHEMA_TYPES.includes(type)) {
              return `value should be either of ${ACCEPTABLE_SCHEMA_TYPES.join(',')}`;
            }

            if (seen.has(name)) {
              return `duplicate value exists for ${name}`;
            }

            seen.add(name);
          }

          return true;
        }
      });

      const formattedSchema = schemaInput.split(',').map((item: string) => {
        item = item.trim();
        const [rawName, rawType] = item.split(':');
        return {
          name: rawName!.trim().toLocaleLowerCase(),
          type: rawType!.trim().toLocaleLowerCase() as Fields['type']
        };
      });

      config.schemas[api] = formattedSchema;
    }

    spinner.start('Initializing configurations');
    await saveConfig(config);
    spinner.succeed('Finished setting up app based on selected configuration');
    return config;
  } catch (error) {
    logger.error(error, 'Config initialization failed');
    throw error;
  }
}

export default defineConfig;
