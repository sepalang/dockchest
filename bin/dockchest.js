#!/usr/bin/env node

const { argv } = require('yargs')
const { doit, pathJoin, readFilePromise, nodeLog } = require('../lib/utils')
const lib = require('../lib/index')
const runner = require('@sepalang/runner')

const [action="manual", target="", ...args] = argv._
const cwd = process.cwd()
const rootPath = pathJoin(cwd, target)



doit(async function(){
  switch(action){
    case "template":
    case "temp":
    case "t":
      lib.template({ rootPath, args })
      break
    case "init":
    case "i":
      lib.init({ rootPath, args })
      break
    case "preview":
    case "pre":
    case "p":
      const configList = await lib.configAll({ action, rootPath, args })
      console.log(nodeLog(configList))
      break
    case "make":
    case "m":
      await caseMake({ rootPath, simpleGuide:true })
      break
    case "build":
    case "b":
      lib.build({ rootPath, args })
      break
    case "run":
    case "r":
      lib.run({ rootPath, args })
      break
    case "manual":
    case "man":
      const [ select ] = await lib.findDockchestFile(rootPath)
      if(!select){
        return
      }
      const preconfig = await lib.readDockchestFile(select)
      const commandInfo = lib.createCommandInfo(preconfig)
      const { commands } = commandInfo
      let runed = []

      if(argv.make || argv.m){
        console.log(`Manual run : doch make`)
        runed.push('make')
        await caseMake({ rootPath, simpleGuide:false })
      }

      if(argv.build || argv.b){
        await runner(async function({ run }){
          runed.push('build')
          const command = commands.find(function({ action }){ return action === "build" })
          if(!command){
            return
          }
          const { cli }= command
          if(!cli){
            return
          }
          console.log(`Manual run : ${cli}`)
          await run(cli)
        })
      }
      
      if(argv.run || argv.r){
        await runner(async function({ run }){
          runed.push('run')
          const command = commands.find(function({ action }){ return action === "run" })
          if(!command){
            return
          }
          const { cli }= command
          if(!cli){
            return
          }
          console.log(`Manual run : ${cli}`)
          await run(cli)
        })
      }
      
      if(argv.rund || argv.d){
        await runner(async function({ run }){
          runed.push('rund')
          const command = commands.find(function({ action }){ return action === "rund" })
          if(!command){
            return
          }
          const { cli }= command
          if(!cli){
            return
          }
          console.log(`Manual run ${cli}`)
          await run(cli)
        })
      }
      console.log(lib.createSimpleGuideByCommandInfo(commandInfo))
      break
    default:
      console.log(await readFilePromise(pathJoin(__dirname, 'man.txt')))
      break
  }
})

async function caseMake ({ rootPath, simpleGuide = true }){
  return await lib.makeAll({ rootPath, simpleGuide })
}