const { argv } = require('yargs')
const { doit, pathJoin, readFilePromise, nodeLog } = require('../lib/utils')
const lib = require('../lib/index')

const [action="", target="", ...args] = argv._
const cwd = process.cwd()
const rootPath = pathJoin(cwd, target)

doit(async function(){
  switch(action){
    case "pre":
      const configList = await lib.configAll({ action, rootPath, args })
      console.log(nodeLog(configList))
      break
    case "make":
      lib.makeAll({ action, rootPath, args })
      break
    case "manual":
      const [ select ] = await lib.findDockchestFile(rootPath)
      if(!select){
        return
      }
      const preconfig = await lib.readDockchestFile(select)
      const commandInfo = lib.createCommandInfo(preconfig)
      console.log(lib.createSimpleGuideByCommandInfo(commandInfo))
      break
    case "run":
      lib.run({ action, rootPath, args })
      break
    default:
      console.log(await readFilePromise(pathJoin(__dirname, 'man.txt')))
      break
  }
})
