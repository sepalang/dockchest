const { findDockchestFile, readDockchestFile } = require("../reader")
const { 
  buildCommandInfoWithPrompt, 
  createUserGuideByCommandInfo, 
  createSimpleGuideByCommandInfo 
} = require("../cli-builder")
const { 
  writeFilePromise,
  pathJoin,
} = require('../utils')

async function makeByDockchestPreconfig (preconfig){
  const { targetPath, destination } = preconfig
  const commandInfo = await buildCommandInfoWithPrompt(preconfig)
  const result = {
    preconfig,
    commandInfo,
    writeFiles: []
  }
    
  if(destination.dockerignoreContent){
    const ignorePath = pathJoin(targetPath,".dockerignore")
    await writeFilePromise(ignorePath, destination.dockerignoreContent)
    result.writeFiles.push(ignorePath)
  }
  
  if(destination.dockerscriptContent){
    const dockerfilePath = pathJoin(targetPath,"Dockerfile")
    await writeFilePromise(dockerfilePath, destination.dockerscriptContent)
    result.writeFiles.push(dockerfilePath)
  }
  
  const markdownPath = pathJoin(targetPath,"DockerHelp.md")
  await writeFilePromise(markdownPath, createUserGuideByCommandInfo(commandInfo))
  result.writeFiles.push(markdownPath)

  return result
}

async function runMakeAll ({ executePath, simpleGuide = true }){
  const dockerfiles = await findDockchestFile(executePath)
  const pendingRead = dockerfiles.map(async function(dockerfilePath){
    return await readDockchestFile(dockerfilePath)
  })
  const dockchestPreconfigList = await Promise.all(pendingRead)

  dockchestPreconfigList.map(async function(preconfig){
    const { commandInfo } = await makeByDockchestPreconfig(preconfig)
    if(simpleGuide === true){
      console.log(createSimpleGuideByCommandInfo(commandInfo))
    }
  })
}

module.exports = {
  makeByDockchestPreconfig,
  runMakeAll
}