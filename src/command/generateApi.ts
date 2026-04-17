import { readConfig } from '../utils/config';
import buildTemplate from '../utils/buildTemplate';
import { buildPath, getCliRoot, getRoot } from '../utils/file';
import { manageDeps } from './dependencyManager';

//eslint-disable-next-line complexity
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

  //types
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

  //install deps based on config
  await manageDeps({
    language,
    database,
    logger
  });
}

export default generateApi;
