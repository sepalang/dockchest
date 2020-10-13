#!/usr/bin/env node

const { argv } = require('yargs')
const { doit, pathJoin, readFilePromise, nodeLog } = require('../lib/utils')
const lib = require('../lib/index')
const runner = require('@sepalang/runner')

const [action="manual", target="", ...args] = argv._
const cwd = process.cwd()
const executePath = pathJoin(cwd, target)

async function caseMake ({ executePath, simpleGuide = true }){
  console.log("lib", lib)
  return await lib.runMakeAll({ executePath, simpleGuide })
}

try {
  doit(async function(){
    switch(action){
      case "template":
      case "temp":
      case "t":
        lib.template({ executePath, args })
        break
      case "init":
      case "i":
        lib.init({ executePath, args })
        break
      case "asap":
      case "a":
        await lib.runAsap({ executePath, args })
        break
      case "make":
      case "m":
        await caseMake({ executePath, simpleGuide:true })
        break
      case "build":
      case "b":
        lib.build({ executePath, args })
        break
      case "run":
      case "r":
        console.log("If you need exit")
        lib.runDeamon({ executePath, args })
        break
      case "manual":
      case "man":
        const [ select ] = await lib.findDockchestFile(executePath)
        if(!select){
          return
        }
        const preconfig = await lib.readDockchestFile(select)
        const commandInfo = await lib.buildCommandInfoWithPrompt(preconfig)
        const { commands } = commandInfo
        let runed = []
  
        if(argv.make || argv.m){
          console.log(`Manual run : doch make`)
          runed.push('make')
          await caseMake({ executePath, simpleGuide:false })
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
        console.log(lib.createSimpleStandardOutGuide(commandInfo))
        break
      default:
        console.log(await readFilePromise(pathJoin(__dirname, 'man.txt')))
        break
    }
  })
} catch (error){
  console.log(error)
  process.exit(1)
}

