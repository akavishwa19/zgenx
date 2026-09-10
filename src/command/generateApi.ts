import { readConfig } from '../utils/config';
import buildTemplate from '../utils/buildTemplate';
import {
  buildPath,
  getCliRoot,
  getRoot,
  isFilePresent,
  readAsJson,
  saveAsJson
} from '../utils/file';
import { manageDeps } from './dependencyManager';
import { PackageJson } from 'type-fest';

/* eslint-disable complexity */
async function generateApi() {
  const { language, type, database, docker, structure, logger, apis, schemas } =
    await readConfig();

  const outputExt = language === 'javascript' ? '.js' : '.ts';

  const cliRoot = getCliRoot();
  const appRoot = getRoot();
  const templateRoot = buildPath(cliRoot, 'src', 'templates');
  const outputRoot = buildPath(appRoot, 'output');

  //index file
  buildTemplate(
    buildPath(templateRoot, 'app', 'app.ejs'),
    buildPath(outputRoot, `app${outputExt}`),
    {
      language,
      type,
      logger
    }
  );

  //logger
  if (logger === 'yes') {
    buildTemplate(
      buildPath(templateRoot, 'utils', 'logger.ejs'),
      buildPath(outputRoot, 'utils', `logger${outputExt}`),
      {
        language,
        type,
        logger
      }
    );
  }

  //dockerfiles
  if (docker === 'yes') {
    buildTemplate(
      buildPath(templateRoot, 'docker', 'dockerfile.ejs'),
      buildPath(outputRoot, '..', 'containers', `Dockerfile`),
      {
        cmd: 'start'
      }
    );

    buildTemplate(
      buildPath(templateRoot, 'docker', 'dockerfile.ejs'),
      buildPath(outputRoot, '..', 'containers', `Dockerfile.dev`),
      {
        cmd: 'dev'
      }
    );

    buildTemplate(
      buildPath(templateRoot, 'docker', 'compose.ejs'),
      buildPath(outputRoot, '..', `compose.yaml`),
      {
        database
      }
    );
  }

  //apis
  //index route
  buildTemplate(
    buildPath(templateRoot, 'routes', 'index.ejs'),
    buildPath(outputRoot, 'routes', `index${outputExt}`),
    {
      type,
      apis
    }
  );

  //routes
  for (const api of apis) {
    buildTemplate(
      buildPath(templateRoot, 'routes', 'route.ejs'),
      buildPath(outputRoot, 'routes', `${api}${outputExt}`),
      {
        type,
        api
      }
    );
  }

  //types and tsconfig
  if (language === 'typescript') {
    for (const api of apis) {
      buildTemplate(
        buildPath(templateRoot, 'types', 'type.ejs'),
        buildPath(outputRoot, 'types', `${api}${outputExt}`),
        {
          language: language,
          api: api,
          fields: schemas[api]
        }
      );
    }

    buildTemplate(
      buildPath(templateRoot, 'base', 'tsconfig.ejs'),
      buildPath(outputRoot, '..', 'tsconfig.json')
    );
  }

  //models
  for (const api of apis) {
    buildTemplate(
      buildPath(templateRoot, 'db', database, 'model.ejs'),
      buildPath(outputRoot, 'models', `${api}${outputExt}`),
      {
        type: type,
        language: language,
        api: api,
        fields: schemas[api]
      }
    );
  }

  //connection file
  buildTemplate(
    buildPath(templateRoot, 'db', database, 'connection.ejs'),
    buildPath(outputRoot, 'db', `client${outputExt}`),
    {
      type,
      language,
      logger
    }
  );

  //controllers
  if (structure === 'basic') {
    for (const api of apis) {
      buildTemplate(
        buildPath(templateRoot, 'controllers', 'controller-basic.ejs'),
        buildPath(outputRoot, 'controllers', `${api}${outputExt}`),
        {
          type,
          logger,
          language,
          api
        }
      );
    }
  } else if (structure === 'advanced') {
    for (const api of apis) {
      buildTemplate(
        buildPath(templateRoot, 'controllers', 'controller-advanced.ejs'),
        buildPath(outputRoot, 'controllers', `${api}${outputExt}`),
        {
          type,
          logger,
          language,
          api
        }
      );

      //service
      buildTemplate(
        buildPath(templateRoot, 'services', 'service.ejs'),
        buildPath(outputRoot, 'services', `${api}${outputExt}`),
        {
          type,
          language,
          api
        }
      );
    }
  }

  //generate envs
  if (isFilePresent(buildPath(appRoot, '.env'))) {
    buildTemplate(
      buildPath(templateRoot, 'envs', 'env.ejs'),
      buildPath(outputRoot, '..', '.env')
    );
  }
  if (isFilePresent(buildPath(appRoot, 'docker.env'))) {
    buildTemplate(
      buildPath(templateRoot, 'envs', 'docker.env.ejs'),
      buildPath(outputRoot, '..', 'docker.env')
    );
  }

  //install deps based on config
  await manageDeps({
    language,
    database,
    logger
  });

  updatePkj(buildPath(appRoot, 'package.json'), language, outputExt);
}

function updatePkj(filePath: string, language: string, outputExt: string) {
  const pkg = readAsJson(filePath) as PackageJson;

  //write pkg json scripts
  if (pkg.scripts) {
    pkg.scripts.dev = `nodemon src/app${outputExt}`;
    pkg.scripts.start = `node dist/app.js`;
    pkg.scripts.format = `prettier --log-level=silent --write .`;
    pkg.scripts.format = `prettier --log-level=silent --check .`;
    pkg.scripts.format = `rimraf dist`;
    pkg.scripts.build = `tsc --project tsconfig.json`;
    pkg.scripts.pretest = `npm run clean && npm run build`;
    pkg.scripts.test = `jest`;
    pkg.scripts['test:coverage'] = `jest --coverage --runInBand`;
    pkg.scripts.prelint = `npm run clean && npm run build`;
    pkg.scripts['lint:fix'] = `eslint --fix src tests`;
    pkg.scripts.lint = `eslint src tests`;
  }

  saveAsJson(filePath, pkg);
}

export default generateApi;
