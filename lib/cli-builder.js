const {
  get,
  doit,
  asArray,
  pathResolve, 
  generateUUID
} = require('./utils')

function buildCommandInfoWithPrompt (preconfig, option = {}){
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

  // --name
  const __name = doit(function(){
    const name = preconfig.config.run.name
    return name ? `--name=${name}` : null
  })
  
  // --hostname
  const __hostname = doit(function(){
    const host = preconfig.config.run.hostname
    return host ? `--hostname=${host}` : null
  })
  
  // --net, --network
  // {values, cli}
  const __net = doit(function(){
    const values = [
      ...asArray(preconfig.config.run['net']), 
      ...asArray(preconfig.config.run['network'])
    ].filter((value)=>typeof value === "string" && value)
    
    if(values.length === 0){
      return null
    }

    return {
      values,
      cli:values.map((value)=>(`--net=${value}`)).join(' ')
    }
  })

  // --net-alias, --network-alias
  // {values, cli}
  const __net_alias = doit(function(){
    const values = [
      ...asArray(preconfig.config.run['net-alias']), 
      ...asArray(preconfig.config.run['network-alias']),
      ...asArray(preconfig.config.run['netAlias']), 
      ...asArray(preconfig.config.run['networkAlias']),
    ].filter((value)=>typeof value === "string" && value)

    if(values.length === 0){
      return null
    }

    return {
      values,
      cli:values.map((value)=>(`--net-alias=${value}`)).join(' ')
    }
  })

  // --memory
  const __memory = doit(function(){
    const memory = preconfig.config.run.memory
    return memory ? `--memory=${memory}` : null
  })
  
  const __link = doit(function(){
    const linkBag = []

    if(preconfig.config.run.link){
      linkBag.push(preconfig.config.run.link)
    }

    if(Array.isArray(preconfig.config.run.links)){
      preconfig.config.run.links.forEach(function(link){
        linkBag.push(link)
      })
    }
    
    const linkCommandList = linkBag.map(function(link){
      return (typeof link === "string" && link) ? `--link=${link}` : null
    }).filter(Boolean)

    return linkCommandList.length === 0 ? null : linkCommandList.join(" ")
  })
  
  const __publish = doit(function(){
    const publishBag = []
    
    if(preconfig.config.run.publish){
      publishBag.push(preconfig.config.run.publish)
    }
    
    if(Array.isArray(preconfig.config.run.publishes)){
      preconfig.config.run.publishes.forEach(function(publish){
        publishBag.push(publish)
      })
    }
    
    const publishList = publishBag.map(function(publish){
      if(Array.isArray(publish)){
        return `-p ${publish.join(":")}`
      }
      if(publish && typeof publish === "string"){
        return `-p ${publish}`
      }
      return null
    }).filter(Boolean)
    
    return publishList.length === 0 ? null : publishList.join(" ")
  })

  // --label
  const __label = doit(function(){
    const labelBag = []
    
    if(preconfig.config.run.label){
      labelBag.push(preconfig.config.run.label)
    }
    
    if(Array.isArray(preconfig.config.run.labels)){
      preconfig.config.run.labels.forEach(function(label){
        labelBag.push(label)
      })
    }
    
    const labelList = labelBag.map(function(label){
      if(Array.isArray(label)){
        return `-l "${label.join("")}"`
      }
      if(label && typeof label === "string"){
        return `-l "${label}"`
      }
      return null
    }).filter(Boolean)
    
    return labelList.length === 0 ? null : labelList.join(" ")
  })
  
  const __volume = doit(function(){
    const volumeBag = []
    
    if(preconfig.config.run.volume){
      volumeBag.push(preconfig.config.run.volume)
    }
    
    if(Array.isArray(preconfig.config.run.volumes)){
      preconfig.config.run.volumes.forEach(function(volume){
        volumeBag.push(volume)
      })
    }
    
    const volumeList = volumeBag.map(function(volume){
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

  const __privileged = doit(function (){
    return preconfig.config.run.privileged ? "--privileged" : null
  })

  const __device = doit(function(){
    const deviceBag = []
    
    if(preconfig.config.run.device){
      deviceBag.push(preconfig.config.run.device)
    }
    
    if(Array.isArray(preconfig.config.run.devices)){
      preconfig.config.run.devices.forEach(function(volume){
        deviceBag.push(volume)
      })
    }
    
    const deviceList = deviceBag.map(function(volume){
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
          return `--device="${hostDir}:${containerDir}"`
        } else {
          volume = volume[0]
        }
      }
      if(volume && typeof volume === "string"){
        return `--device="${volume}"`
      }
      return null
    }).filter(Boolean)
    
    return deviceList.length === 0 ? null : deviceList.join(" ")
  })
  
  const runItCliPrefix = [
    "docker",
    "run",
  ]

  const runCliSuffix = [
    __name,
    __hostname,
    get(__net, 'cli'),
    get(__net_alias, 'cli'),
    __link,
    __publish,
    __volume,
    __privileged,
    __device,
    __env,
    __memory,
    __label,
    container,
  ]

  if(__net){
    commands.push({
      name:"You need to create a new docker network",
      cli:__net.values.map((value)=>{
        return `docker network create ${value}`
      }).join(" &&")
    });  
  }
    
  commands.push({
    name:"Build",
    action:"build",
    cli:buildCli,
    dockchestCli:"doch build",
    foot: ["docker images"]
  })

  commands.push({
    name:"Run with deamon",
    action:"rund",
    cli:[...runItCliPrefix, "-i", "-t", "-d", ...runCliSuffix].filter(Boolean).join(" "), 
    dockchestCli:"doch run"
  })

  commands.push({
    name:"Run with attach",
    action:"run",
    cli:[...runItCliPrefix, "-i", "-t", ...runCliSuffix].filter(Boolean).join(" "), 
  })

  commands.push({
    name:"Run as soon as possible (build & run)",
    action:"asap",
    cli:[...runItCliPrefix, "-i", "-t", ...runCliSuffix].filter(Boolean).join(" "), 
    dockchestCli:"doch asap" 
  })
  
  console.log({
    __name,
    __hostname,
    __net_alias,
    __link,
    __publish,
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
      __link,
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

function createSimpleStandardOutGuide (commandInfo){
  const { commands } = commandInfo
  const simpleGuideContents = []

  commands.forEach(function(command){
    if(asArray(command.disabled).includes("SimpleGuide")){
      return
    }
    simpleGuideContents.push(`- [${command.name}]`)
    command.dockchestCli && simpleGuideContents.push(`BIN : ${command.dockchestCli}`)
    simpleGuideContents.push(`CLI : ${command.cli}\n`)
  })
  
  return simpleGuideContents.join('\n')
}

module.exports = {
  buildCommandInfoWithPrompt,
  createUserGuideByCommandInfo,
  createSimpleStandardOutGuide
}