const runner = require('@sepalang/runner')
const { findTemplateFile, readTemplateFile } = require('./reader')
const { 
  arrayMapPromise,
  pathJoin,
} = require('../utils')


async function template ({ rootPath }){
  const readList = await arrayMapPromise(findTemplateFile(pathJoin(__dirname, "templates")), readTemplateFile)
  console.log("readList", readList)
}

async function init (){

}

module.exports = {
  template,
  init
}