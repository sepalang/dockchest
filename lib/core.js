const { build } = require('./commands/build')
const { run, runDeamon } = require('./commands/run')
const { init, template } = require('./commands/init')
const { runAsap } = require('./commands/asap')
const { runMakeAll } = require('./commands/make')
const { buildCommandInfoWithPrompt, createSimpleStandardOutGuide } = require('./cli-builder')

const { findDockchestFile, readDockchestFile } = require('./reader')

module.exports = Object.assign(
  exports,
  {
    findDockchestFile,
    readDockchestFile,
  },
  {
    buildCommandInfoWithPrompt,
    createSimpleStandardOutGuide,
  },
  {
    runMakeAll,
    template,
    init,
    build,
    run,
    runDeamon,
    runAsap,
  }
);