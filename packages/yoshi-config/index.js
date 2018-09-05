const path = require('path');
const _ = require('lodash');
const chalk = require('chalk');
const globs = require('./globs');
const packagejson = require('./utils/get-project-pkg');
const lookupConfig = require('./utils/lookup-config');
const validateConfig = require('./utils/validate-config');
const YoshiOptionsValidationError = require('./utils/YoshiOptionsValidationError');

const loadConfig = () => {
  const config = lookupConfig();

  try {
    validateConfig(config);
  } catch (err) {
    if (err instanceof YoshiOptionsValidationError) {
      console.warn(chalk.yellow('Warning: ' + err.message));
    } else {
      throw err;
    }
  }

  const getConfig = (key, defaultVal = false) => {
    return _.get(config, key, defaultVal);
  };

  const projectConfig = {
    name: packagejson.name,
    unpkg: packagejson.unpkg,
    specs: {
      node: getConfig('specs.node'),
      browser: getConfig('specs.browser'),
    },
    hooks: getConfig('hooks', {}),
    hmr: getConfig('hmr', true),
    liveReload: getConfig('liveReload', true),
    exports: getConfig('exports'),
    clientProjectName: getConfig('clientProjectName'),
    clientFilesPath: (() => {
      const clientProjectName = getConfig('clientProjectName');
      const dir = getConfig('servers.cdn.dir');

      return clientProjectName
        ? `node_modules/${clientProjectName}/${dir ||
            globs.multipleModules.clientDist}`
        : dir || globs.singleModule.clientDist;
    })(),
    isUniversalProject: getConfig('universalProject'),
    isAngularProject:
      !!_.get(packagejson, 'dependencies.angular', false) ||
      !!_.get(packagejson, 'peerDependencies.angular', false),
    isReactProject:
      !!_.get(packagejson, 'dependencies.react', false) ||
      !!_.get(packagejson, 'peerDependencies.react', false),
    isEsModule: !!_.get(packagejson, 'module', false),
    servers: {
      cdn: {
        port: getConfig('servers.cdn.port', 3200),
        url: (
          ssl, // TODO REMOVE FUNCTION
        ) =>
          getConfig(
            'servers.cdn.url',
            `${ssl ? 'https:' : 'http:'}//localhost:${
              projectConfig.servers.cdn.port
            }/`,
          ),
        ssl: getConfig('servers.cdn.ssl', false),
      },
    },
    entry: getConfig('entry'),
    splitChunks: getConfig('splitChunks', false),
    defaultEntry: './client',
    separateCss: getConfig('separateCss', true),
    cssModules: getConfig('cssModules', true),
    tpaStyle: getConfig('tpaStyle', false),
    enhancedTpaStyle: getConfig('enhancedTpaStyle', false),
    features: getConfig('features', {}),
    externals: getConfig('externals', []),
    babel: _.get(packagejson, 'babel'),
    transpileTests: getConfig('transpileTests', true),
    runIndividualTranspiler: getConfig('runIndividualTranspiler', true),
    jestConfig: _.get(packagejson, 'jest', {}),
    petriSpecsConfig: getConfig('petriSpecs', {}),
    performanceBudget: getConfig('performance'),
    resolveAlias: getConfig('resolveAlias', {}),
    keepFunctionNames: getConfig('keepFunctionNames', false),
    umdNamedDefine: getConfig('umdNamedDefine', true),
    unprocessedModules: p => {
      const allSourcesButExternalModules = function(filePath) {
        filePath = path.normalize(filePath);
        return (
          filePath.startsWith(process.cwd()) &&
          !filePath.includes('node_modules')
        );
      };

      const externalUnprocessedModules = ['wix-style-react/src'].concat(
        getConfig('externalUnprocessedModules', []),
      );

      const externalRegexList = externalUnprocessedModules.map(
        m => new RegExp(`node_modules/${m}`),
      );

      return (
        externalRegexList.some(regex => regex.test(p)) ||
        allSourcesButExternalModules(p)
      );
    },
  };

  return projectConfig;
};

module.exports = loadConfig();