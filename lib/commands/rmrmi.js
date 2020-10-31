const runner = require('@sepalang/runner')
const { readPs, readImages } = require('../readDocker')


async function selectContainers ({ message="Please select containers" }={}){
  const data = await readPs()
  return await runner(async ({ select })=>{
    const options = data.map((referenece)=>{
      return {
        label:`${referenece['IMAGE']}:${referenece['NAMES']}:${referenece['CONTAINER_ID']}`,
        value:referenece['CONTAINER_ID'],
        referenece
      }
    })
    const targetIds = await select({
      message:message,
      multiple: true,
      options
    })
    return targetIds;
  })
}

async function selectImages ({ message="Please select images" }={}){
  const data = await readImages()
  return await runner(async ({ select })=>{
    const options = data.map((referenece)=>{
      return {
        label:`${referenece['REPOSITORY']}:${referenece['TAG']}:${referenece['IMAGE_ID']}(${referenece['SIZE']}) - ${referenece['CREATED']}`,
        value:referenece['IMAGE_ID'],
        referenece
      }
    })
    const targetIds = await select({
      message:message,
      multiple: true,
      options
    })
    return targetIds;
  })
}


async function runRm (){
  const { run, confirm } = await runner()
  const removeTargets = await selectContainers({ message:"Please select remove containers" });
  if(removeTargets.length && (await confirm(`Are you sure to delete the ${removeTargets.length} containers?`))){
    await run(`docker rm -f ${removeTargets.join(' ')}`)
    console.log("Successfully removed")
  }
}

async function runRmi (){
  const { run, confirm } = await runner()
  const removeTargets = await selectImages({ message:"Please select remove images" });
  if(removeTargets.length && (await confirm(`Are you sure to delete the ${removeTargets.length} images?`))){
    await run(`docker rmi -f ${removeTargets.join(' ')}`)
    console.log("Successfully removed")
  }
}

module.exports = {
  runRm,
  runRmi,
  selectContainers,
  selectImages,
}