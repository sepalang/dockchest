const YAML = require('yaml')
const { 
  doit,
  asArray,
  globPromise,
  readFilePromise,
  writeFilePromise,
  pathJoin,
  pathResolve, 
  matchWhile,
  generateUUID
} = require('./utils')


const DEFAULT_IGNORE = [
  "# dockchest",
  "Dockchest.yml",
  "DockerDesing.yml",
  "DockerHelp.md"
]

async function findDockchestFile  (rootPath){
  const { files } = await globPromise(pathJoin(rootPath, "**", "?(dockchest|DockerDesign)?(.yml|.yaml)"))
  return files  
}

function vaildateDockchestFile (data){
  if(typeof data !== "object"){
    throw new Error('YAML parse error')
  }
  return data
}

async function readDockchestFile (configPath){
  const targetPath = pathJoin(configPath,"..")
  const dockgofileContent = await readFilePromise(configPath)
  const { 
    env = {},
    arg = {},
    ...config
  } = YAML.parse(dockgofileContent)
  
  vaildateDockchestFile(config)
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

async function configAll ({ rootPath }){
  const dockerfiles = await findDockchestFile(rootPath)
  const pendingRead = dockerfiles.map(async function(dockerfilePath){
    return await readDockchestFile(dockerfilePath)
  })
  const readList = await Promise.all(pendingRead)
  return readList
}

function createCommandInfo (preconfig, option = {}){
  const targetPath = preconfig.targetPath
  const container = preconfig.config.build.tag.join(':')
  const revision = option.revision && typeof option.revision === "string" ? revision : generateUUID('xxyx')
  const commands = [{
    name: "Directory",
    cli: 'cd '+ targetPath,
    disabled: ['UserGuide']
  }]
  
  const __tag = doit(function(){
    return `--tag ${container}`
  })

  const __file = doit(function(){
    return `--file Dockerfile`
  })

  // --build-arg
  const __build_arg = doit(function(){
    const arg = preconfig.arg
    if(!arg){
      return ""
    }
    const argKeys = Object.keys(arg)
    return argKeys.reduce(function(dest, key){
      dest.push(`--build-arg ${key}=${arg[key]}`)
      return dest
    },[]).join(' ');
  })
  // --env
  const __env = doit(function(){
    const env = preconfig.env
    if(!env){
      return ""
    }
    const envKeys = Object.keys(env)
    return envKeys.reduce(function(dest, key){
      dest.push(`--env ${key}=${env[key]}`)
      return dest
    },[]).join(' ');
  })
  
  const buildCli = [
    "docker",
    "build",
    __tag,
    __file,
    __build_arg,
    "."
  ].filter(Boolean).join(" ")
  
  commands.push({
    name:"Build",
    action:"build",
    cli:buildCli,
    foot: ["docker images"]
  })
  
  // --name
  const __name = doit(function(){
    const name = preconfig.config.run.name
    return name ? `--name="${name}"` : null
  })
  
  // --hostname
  const __hostname = doit(function(){
    const host = preconfig.config.run.hostname
    return host ? `--hostname="${host}"` : null
  })
  
  // --net-alias
  const __net_alias = doit(function(){
    const netAlias = preconfig.config.run['net-alias']
    return netAlias ? `--net-alias="${netAlias}"` : null
  })

  // --memory
  const __memory = doit(function(){
    const memory = preconfig.config.run.memory
    return memory ? `--memory="${memory}"` : null
  })
  
  // TODO: --net
  // const __net = doit(function(){
  //   const net = preconfig.config.run.net
  //   return net ? `--net ${net}` || null
  // })
  
  //TODO: --link
  
  const __publish = doit(function(){
    const publishReady = []
    
    if(preconfig.config.run.publish){
      publishReady.push(preconfig.config.run.publish)
    }
    
    if(Array.isArray(preconfig.config.run.publishes)){
      preconfig.config.run.publishes.forEach(function(publish){
        publishReady.push(publish)
      })
    }
    
    const publishList = publishReady.map(function(publish){
      if(Array.isArray(publish)){
        return `--publish="${publish.join(":")}"`
      }
      if(publish && typeof publish === "string"){
        return `--publish="${publish}"`
      }
      return null
    }).filter(Boolean)
    
    return publishList.length === 0 ? null : publishList.join(" ")
  })
  
  const __volume = doit(function(){
    const volumeReady = []
    
    if(preconfig.config.run.volume){
      volumeReady.push(preconfig.config.run.volume)
    }
    
    if(Array.isArray(preconfig.config.run.volumes)){
      preconfig.config.run.volumes.forEach(function(volume){
        volumeReady.push(volume)
      })
    }
    
    const volumeList = volumeReady.map(function(volume){
      if(Array.isArray(volume)){
        if(volume.length > 1){
          const hostDir = doit(function(){
            if(volume[0].indexOf(".") === 0){
              return pathResolve(targetPath, volume[0])
            } else {
              return volume[0]
            }
          })
          const containerDir = volume[1]
          return `--volume="${hostDir}:${containerDir}"`
        } else {
          volume = volume[0]
        }
      }
      if(volume && typeof volume === "string"){
        return `--volume="${volume}"`
      }
      return null
    }).filter(Boolean)
    
    return volumeList.length === 0 ? null : volumeList.join(" ")
  })
  
  const runItCliPrefix = [
    "docker",
    "run",
    "-i",
    "-t",
  ]

  const runCliSuffix = [
    __name,
    __hostname,
    __net_alias,
    __publish,
    __volume,
    __env,
    __memory,
    container,
  ]

  commands.push({
    name:"Run with attach",
    action:"run",
    cli:[...runItCliPrefix, ...runCliSuffix].filter(Boolean).join(" ") 
  })

  commands.push({
    name:"Run with deamon",
    action:"rund",
    cli:[...runItCliPrefix, "-d", ...runCliSuffix].filter(Boolean).join(" ") 
  })
  
  return { 
    commands,
    elements:{
      targetPath,
      revision,
      container,
      __tag,
      __file,
      __build_arg,
      __env,
      __name,
      __hostname,
      __publish,
      __volume,
      __memory
    }
  }
}


function createUserGuideByCommandInfo (commandInfo){
  const { commands } = commandInfo
  const userGuideContents = ['## Command guide\n']

  commands.forEach(function(command){
    if(asArray(command.disabled).includes("UserGuide")){
      return
    }
    userGuideContents.push(
`### ${command.name}
\`\`\`
${command.cli}
${asArray(command.foot).join('\n')}
\`\`\`
`
    )
  })

  return userGuideContents.join('\n')
}

function createSimpleGuideByCommandInfo (commandInfo){
  const { commands } = commandInfo
  const simpleGuideContents = []

  commands.forEach(function(command){
    if(asArray(command.disabled).includes("SimpleGuide")){
      return
    }
    simpleGuideContents.push(`- [${command.name}]`)
    simpleGuideContents.push(``)
    simpleGuideContents.push(`  ${command.cli}\n`)
  })
  
  return simpleGuideContents.join('\n')
}

async function makeAll ({ rootPath, simpleGuide = true }){
  const pendingConfig = await configAll({ rootPath })

  pendingConfig.map(async function(preconfig){
    const { targetPath, destination } = preconfig
    
    if(destination.dockerignoreContent){
      await writeFilePromise(pathJoin(targetPath,".dockerignore"), destination.dockerignoreContent)
    }
    
    if(destination.dockerscriptContent){
      await writeFilePromise(pathJoin(targetPath,"Dockerfile"), destination.dockerscriptContent)
    }
    
    const cli = createCommandInfo(preconfig)
    await writeFilePromise(pathJoin(targetPath,"DockerHelp.md"), createUserGuideByCommandInfo(cli))

    if(simpleGuide === true){
      console.log(createSimpleGuideByCommandInfo(cli))
    }
    
  })
}



module.exports = Object.assign(exports, {
  configAll,
  makeAll,
  findDockchestFile,
  readDockchestFile,
  createCommandInfo,
  createSimpleGuideByCommandInfo,
})