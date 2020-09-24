const runner = require('@sepalang/runner')
const { findTemplateFile, readTemplateFile, } = require('../reader')
const { 
  cloneDeep,
  writeFilePromise,
  arrayMapPromise,
  entriesOfCopyFiles,
  loadHelper,
  pathJoin,
  renderEJS,
  get,
} = require('../utils')


async function selectTemplate (){
  const { select } = await runner()
  const readList = await arrayMapPromise(findTemplateFile(pathJoin(__dirname, "..", "..", "templates")), readTemplateFile)
  const options = readList.map(function(value){
    return {
      label: get(value, ["targetData", "name"]) || get(value, ["targetPath"]),
      value
    }
  })
  const [ selected ] = await select({
    message:"Template list",
    options
  })
  return selected
}

async function template ({ executePath }){
  const selected = await selectTemplate()
  console.log("readList", selected)
}

async function init ({ executePath }){
  const helper = await loadHelper()
  const selected = await selectTemplate()
  const { targetData:{ data, derivedData, prepareCopy }, templateDir, templateFiles } = selected
  const globalData = cloneDeep(data)

  function generateParam (options){
    return Object.assign({ data:{}, helper }, options)
  }

  if(typeof derivedData === "function"){
    const result = await derivedData(generateParam({ data:globalData }))
    if(result === false){
      console.log("Initializ template has been cancelled.")
      process.exit(0)
      return
    }
    Object.assign(globalData, result)
  }

  const destinations = entriesOfCopyFiles(templateDir, templateFiles, executePath)
  const prepareCopys = arrayMapPromise(destinations, async function([originalPath, copyPath]){
    const scopeData = cloneDeep(globalData)
    let copyAvailable = true;
    if(typeof prepareCopy === "function"){
      const result = await prepareCopy(generateParam({ data:scopeData, originalPath, copyPath, helper }))
      if(result === false){
        copyAvailable = false;
      }
    }
    return {
      data:scopeData,
      copyAvailable,
      originalPath,
      copyPath
    }
  })

  const lastConfirm = await helper.confirm(`Are you sure the templates will be installed from ${executePath}?`)

  if(lastConfirm === false){
    console.log("Initializ template has been cancelled.")
    process.exit(0)
    return
  }

  await arrayMapPromise(prepareCopys, async function({ data, copyAvailable, originalPath, copyPath }){
    if(copyAvailable === false){
      return
    }
    
    await renderEJS(originalPath, data)
    .then(function (content){
      return writeFilePromise(copyPath, content)
    })
    .then(function(){
      console.log(copyPath)
    })
  })

}

module.exports = {
  template,
  init
}