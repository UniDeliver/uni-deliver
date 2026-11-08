const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@unideliver/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform);
  } catch (err) {
    if (moduleName.endsWith('.js')) {
      const trimmed = moduleName.slice(0, -3);
      try {
        return (defaultResolveRequest || context.resolveRequest)(context, trimmed, platform);
      } catch {
        throw err;
      }
    }
    throw err;
  }
};

module.exports = config;
