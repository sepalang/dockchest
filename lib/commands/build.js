const runner = require('@sepalang/runner')
const { findDockchestFile, readDockchestFile } = require('./reader')
const { 
  arrayMapPromise,
  pathJoin,
} = require('../utils')

async function build ({ rootPath }){
  const { select } = await runner()
  const readList = await arrayMapPromise(findDockchestFile(rootPath), readDockchestFile)  
  const options = readList.map(function(value){
    return {
      label:value.targetPath,
      value
    }
  })
  
  const selected = await select({
    message:"Build target",
    options
  })

  console.log("TODO :: build ::", { selected })
}

module.exports = {
  build
}