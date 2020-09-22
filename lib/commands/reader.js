const YAML = require('yaml')

const { 
  doit,
  globPromise,
  pathJoin,
  readFilePromise,
  matchWhile,
} = require('../utils')

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

async function findTemplateFile  (rootPath){
  const { files } = await globPromise(pathJoin(rootPath, "**", "template.dochest.js"))
  return files  
}

async function readTemplateFile (templatePath){
  
}

async function findDockchestFile  (rootPath){
  const { files } = await globPromise(pathJoin(rootPath, "**", "?(dockchest|DockerDesign)?(.yml|.yaml)"))
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

module.exports = {
  findDockchestFile,
  readDockchestFile,
  findTemplateFile,
  readTemplateFile,
}