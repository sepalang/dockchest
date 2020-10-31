const runner = require('@sepalang/runner')
const { selectContainers, selectImages } = require('../readDocker')

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
  runRmi
}