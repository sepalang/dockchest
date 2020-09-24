const YAML = require('yaml')
const runner = require('@sepalang/runner')
const { 
  doit,
  globPromise,
  pathJoin,
  readFilePromise,
  matchWhile,
} = require('./utils')

const DEFAULT_IGNORE = [
  "# dockchest",
  "Dockchest.yml",
  "DockerDesing.yml",
  "DockerHelp.md"
]

function vaildateYAMLParse (data){
  if(typeof data !== "object"){
    throw new Error('YAML parse error')
  }
  return data
}

async function findTemplateFile  (executePath){
  const files = await globPromise(pathJoin(executePath, "**", "template.dochest?(.js|.json)"))
  return files  
}

async function readTemplateFile (targetPath){
  const targetData = require(targetPath)
  const targetDir = pathJoin(targetPath, "..")
  const templateDir = pathJoin(targetDir, "template")
  const templateFiles = await globPromise(pathJoin(templateDir, "**", "*"), { nodir:true })
  const readInfo = {
    targetDir,
    targetPath,
    targetData,
    templateDir,
    templateFiles,
  }
  return readInfo
}

async function findDockchestFile  (executePath){
  const files = await globPromise(pathJoin(executePath, "**", "?(dockchest|DockerDesign)?(.yml|.yaml)"))
  return files  
}

async function readDockchestFile (configPath){
  const targetPath = pathJoin(configPath,"..")
  const dockgofileContent = await readFilePromise(configPath)
  const {
    env = {},
    arg = {},
    ...config
  } = doit(function(){
    try {
      return YAML.parse(dockgofileContent)
    } catch(error){
      console.log(`Invaild YAML format ${configPath}`)
      throw error
    }
  })

  vaildateYAMLParse(config)
  const dockerignoreContent = [...DEFAULT_IGNORE, "\n#igonre", config.build.ignore].join('\n')
  const dockerscriptContent = config.build.script
  const requireArgName = []
  const dockerfileArgs = []
  const requireEnvNames = []
  const dockerfileEnvs = []

  const fixtureList = matchWhile(/\b(ENV|ARG)\s+.+([^\n]|\b)/g,dockerscriptContent)
  fixtureList.map(function(circle){
    const text = circle[0]
    const internalMatch = text.match(/(?<class>ENV|ARG)(\s+(?<name>[A-Za-z0-9\_\-]+))(\s+(?<value>\S+)|)/)
    
    if(!internalMatch){
      return;
    }

    const internalInstClass = internalMatch.groups.class
    const internalInstName = internalMatch.groups.name
    const internalInstValue = internalMatch.groups.value || ""

    switch(internalInstClass){
      case "ARG":
        requireArgName.push(internalInstName)
        dockerfileArgs.push(internalInstName)
        break
      case "ENV":
        const valueMatches = matchWhile(/(\$(?<includeKey>[A-Za-z0-9\_\-]+)|\{\s*(?<includeKey2>.*)\})/g,internalInstValue)
        valueMatches.forEach(function(circle){
          const includeKey = circle.groups.includeKey || circle.groups.includeKey2
          if(
            !dockerfileArgs.includes(includeKey) || 
            !dockerfileEnvs.includes(includeKey) || 
            !requireEnvNames.includes(includeKey)
          ){
            requireEnvNames.push(includeKey)
          }
        })

        dockerfileArgs.push(internalInstName)
        break
    }
  })
  
  return {
    config,
    configPath,
    targetPath,
    env,
    arg,
    destination:{
      dockerignoreContent,
      dockerscriptContent,
      requireArgName,
      requireEnvNames  
    }
    
  }
}


async function searchAndSelectDockchest({ executePath, userMessage = false }){
  const { select } = await runner()
  const dockchestFiles = await findDockchestFile(executePath)
  if(dockchestFiles.length === 0){
    userMessage && console.log(`Dockchest config file could not be found in ${executePath}`)
    return null
  }
  if(dockchestFiles.length === 1){
    userMessage && console.log(`Found one Dockchest config file in ${dockchestFiles[0]}`)
    return dockchestFiles[0]
  }
  if(dockchestFiles.length > 1){
    const [ selected ] = await select({
      message:`Found multiple Dockchest config file. Please select one.`,
      options:dockchestFiles.map((path)=>({ label:path, value:path }))
    })
    return selected
  }
}


module.exports = {
  findDockchestFile,
  readDockchestFile,
  findTemplateFile,
  readTemplateFile,
  searchAndSelectDockchest,
}