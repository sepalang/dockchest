const YAML = require('yaml')

const { 
  doit,
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
  "Dockerfile.md"
]

async function findDockchestFile  (rootPath){
  const { files } = await globPromise(pathJoin(rootPath, "**", "dockchest.yml"))
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
  const fixtureList = matchWhile(/\bENV\s.*\b/g,dockerscriptContent)
  const dockerfileEnvs = []
  const requireEnvNames = []
  
  fixtureList.map(function(circle){
    const text = circle[0]
    const internalMatch = text.match(/ENV\s+(?<name>\w+)\s*\=\s*(?<value>\$[^\s]*)/)
    const internalEnvName = internalMatch.groups.name
    const internalEnvValue = internalMatch.groups.value
    const findSameNameExp = new RegExp(`(\\s|\\=|)\\$$(\\s|\\b)`,'g')
    
    matchWhile(/(\s|\=|)\$(?<importName>\w+)(\s|\b)/g, internalEnvValue).forEach(function(circle){
      const importName = circle.groups.importName
      if(dockerfileEnvs.includes(importName)){
        return
      }
      requireEnvNames.push(importName)
    })
    
    dockerfileEnvs.push(internalEnvName)

    const hasSameKey = findSameNameExp.test(internalEnvValue)
    hasSameKey && requireEnvNames.push(internalEnvName)
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
  const commands = []
  const targetPath = preconfig.targetPath
  const container = preconfig.config.build.tag.join(':')
  const revision = option.revision && typeof option.revision === "string" ? revision : generateUUID('xxyx')

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
    name:"build",
    cli:buildCli
  })
  
  // --name
  const __name = doit(function(){
    const name = preconfig.config.run.name
    return name ? `--name ${name}` : null
  })
  
  // --host
  const __host = doit(function(){
    const host = preconfig.config.run.host
    return host ? `--host ${host}` : null
  })
  
  // --memory
  const __memory = doit(function(){
    const memory = preconfig.config.run.memory
    return memory ? `--memory ${memory}` : null
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
            if(volume[0].indexOf("..") === 0){
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
  
  const runItCli = `docker attach \$(${[
    "docker",
    "run",
    "-i",
    "-t",
    "-d",
    __name,
    __host,
    __publish,
    __volume,
    __env,
    __memory,
    container
  ].filter(Boolean).join(" ")})` 
  
  commands.push({
    name:"Run it",
    cli:runItCli
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
      __host,
      __publish,
      __volume,
      __memory
    }
  }
}


function createUserGuideByCommandInfo (commandInfo){
  const { commands, elements: { container } } = commandInfo
  const userGuideContents = ['## Command guide\n']

  const cmdBuild = commands.find(({ name })=>(name === 'build'))
  if(cmdBuild){
    userGuideContents.push(
`### Build
\`\`\`
${cmdBuild.cli}
docker images
\`\`\`
`
    )
  }

  const cmdRunit = commands.find(({ name })=>(name === 'Run it'))
  if(cmdRunit){
    userGuideContents.push(
`### run attach
\`\`\`
${cmdRunit.cli}
docker run -p -e ${container}
\`\`\`
`
    )
  }

  return userGuideContents.join('\n')
}

function createSimpleGuideByCommandInfo (commandInfo){
  const { commands, elements: { targetPath } } = commandInfo
  let contents = ''

  if(targetPath){
    contents += `- [Directory]  ${
      [targetPath, 'cd '+targetPath].join('\n  ')
    }\n\n`
  }

  contents += commands.map(function(info){
    return `- [${info.name}]\n  ${info.cli}\n`
  }).join('\n')

  return contents
}

async function makeAll ({ rootPath }){
  const pendingConfig = await configAll({ rootPath })

  pendingConfig.map(async function(preconfig){
    const { targetPath, destination, ...config } = preconfig
    
    if(destination.dockerignoreContent){
      await writeFilePromise(pathJoin(targetPath,".dockerignore"), destination.dockerignoreContent)
    }
    
    if(destination.dockerscriptContent){
      await writeFilePromise(pathJoin(targetPath,"Dockerfile"), destination.dockerscriptContent)
    }
    
    const cli = createCommandInfo(preconfig)
    await writeFilePromise(pathJoin(targetPath,"README_DOCKER.md"), createUserGuideByCommandInfo(cli))
    console.log(createSimpleGuideByCommandInfo(cli))
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