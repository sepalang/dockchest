const runner = require('@sepalang/runner')
const { findDockchestFile, readDockchestFile, searchAndSelectDockchest } = require('../reader')
const { makeByDockchestPreconfig } = require('./make')
const { 
  doit
} = require('../utils')

async function runAsap({ executePath, args }){
  const { select, run } = await runner()

  const selectedFile = await searchAndSelectDockchest({ executePath, userMessage:true })

  if(selectedFile === null){
    process.exit(0)
  }

  //make
  const preconfig = await readDockchestFile(selectedFile)
  
  //make result
  const { commandInfo } = await makeByDockchestPreconfig(preconfig)
  const { commands } = commandInfo
  const buildAction = commands.find(({ action })=>(action === "build")) 
  const deamonAction = commands.find(({ action })=>(action === "rund"))

  // build, run(deamon)
  await run(buildAction.cli)
  await run(deamonAction.cli)
}


module.exports = {
  runAsap
}