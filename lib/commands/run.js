const runner = require('@sepalang/runner')
const { buildCommandInfoWithPrompt } = require('../cli-builder')
const { readDockchestFile, searchAndSelectDockchest } = require('../reader')

async function run ({ executePath }){
  const { run } = await runner()
  const selectedFile = await searchAndSelectDockchest({ executePath, userMessage:true })
  
  if(selectedFile === null){
    process.exit(0)
  }
  
  const preconfig = await readDockchestFile(selectedFile)
  const commandInfo = await buildCommandInfoWithPrompt(preconfig)
  const runCommand = commandInfo.commands.find(({ action })=>action === "run")
  console.log(runCommand.cli)
  run(runCommand.cli)
}

async function runDeamon ({ executePath }){
  const { run } = await runner()
  const selectedFile = await searchAndSelectDockchest({ executePath, userMessage:true })
  
  if(selectedFile === null){
    process.exit(0)
  }
  
  const preconfig = await readDockchestFile(selectedFile)
  const commandInfo = await buildCommandInfoWithPrompt(preconfig)
  const runCommand = commandInfo.commands.find(({ action })=>action === "rund")
  run(runCommand.cli)
}


module.exports = {
  run,
  runDeamon
}