const runner = require('@sepalang/runner')
const { buildCommandInfoWithPrompt } = require('../cli-builder')
const { readDockchestFile, searchAndSelectDockchest } = require('../reader')

async function build ({ executePath }){
  const { run } = await runner()
  const selectedFile = await searchAndSelectDockchest({ executePath, userMessage:true })
  
  if(selectedFile === null){
    process.exit(0)
  }
  
  const preconfig = await readDockchestFile(selectedFile)
  const commandInfo = await buildCommandInfoWithPrompt(preconfig)
  const buildCommand = commandInfo.commands.find(({ action })=>action === "build")
  run(buildCommand.cli)
}

module.exports = {
  build
}