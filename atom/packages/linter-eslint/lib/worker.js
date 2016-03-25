'use strict';
'use babel';
// Note: 'use babel' doesn't work in forked processes

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _workerHelpers = require('./worker-helpers');

var Helpers = _interopRequireWildcard(_workerHelpers);

var _processCommunication = require('process-communication');

var _atomLinter = require('atom-linter');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

process.title = 'linter-eslint helper';

const ignoredMessageV1 = 'File ignored because of your .eslintignore file. Use --no-ignore to override.';
const ignoredMessageV2 = 'File ignored because of a matching ignore pattern. Use --no-ignore to override.';

function lintJob(argv, contents, eslint, configPath, config) {
  if (configPath === null && config.disableWhenNoEslintConfig) {
    return [];
  }
  eslint.execute(argv, contents);
  return global.__LINTER_ESLINT_RESPONSE.filter(function (e) {
    return e.message !== ignoredMessageV1;
  }).filter(function (e) {
    return e.message !== ignoredMessageV2;
  });
}
function fixJob(argv, eslint) {
  try {
    eslint.execute(argv);
    return 'Linter-ESLint: Fix Complete';
  } catch (err) {
    throw new Error('Linter-ESLint: Fix Attempt Completed, Linting Errors Remain');
  }
}

(0, _processCommunication.create)().onRequest('job', function (_ref, job) {
  let contents = _ref.contents;
  let type = _ref.type;
  let config = _ref.config;
  let filePath = _ref.filePath;

  global.__LINTER_ESLINT_RESPONSE = [];

  if (config.disableFSCache) {
    _atomLinter.FindCache.clear();
  }

  const fileDir = _path2.default.dirname(filePath);
  const eslint = Helpers.getESLintInstance(fileDir, config);
  const configPath = Helpers.getConfigPath(fileDir);
  const relativeFilePath = Helpers.getRelativePath(fileDir, filePath, config);

  const argv = Helpers.getArgv(type, config, relativeFilePath, fileDir, configPath);

  if (type === 'lint') {
    job.response = lintJob(argv, contents, eslint, configPath, config);
  } else if (type === 'fix') {
    job.response = fixJob(argv, eslint);
  }
});

process.exit = function () {/* Stop eslint from closing the daemon */};