const runner = require('@sepalang/runner')
const { findTemplateFile, readTemplateFile } = require('./reader')
const { 
  arrayMapPromise,
  pathJoin,
} = require('../utils')


async function template ({ rootPath }){
  const { select } = await runner()
  const readList = await arrayMapPromise(findTemplateFile(pathJoin(__dirname, "..", "..", "templates")), readTemplateFile)
  const options = readList.map(function(value){
    return {
      label:value.targetPath,
      value
    }
  })
  const [ selected ] = await select({
    message:"Template list",
    options
  })
  console.log("readList", selected)
}

async function init (){

}

module.exports = {
  template,
  init
}