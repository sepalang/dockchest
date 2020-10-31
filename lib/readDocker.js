const runner = require('@sepalang/runner')

const COLUME_SPACE_EXP = /[\s]{3,}/

async function readPs (){
  return runner(async ({ run })=>{
    const { stdout } = await run("docker ps -a", { capture:true, silent:true })
    const [head, ...rows] = stdout
    
    const headKeys = head.split(COLUME_SPACE_EXP).map(s=>s.replace(/\s/,"_"))
    const rowValues = rows.map((row)=>row.split(COLUME_SPACE_EXP))

    const data = rowValues.map((values)=>{
      return headKeys.reduce((dest, key, index)=>{
        const value = values[index]
        dest[key] = value || null
        return dest 
      }, {})
    })
    return data;
  })
}

async function readImages (){
  return runner(async ({ run })=>{
    const { stdout } = await run("docker images", { capture:true, silent:true })
    const [head, ...rows] = stdout
    
    const headKeys = head.split(COLUME_SPACE_EXP).map(s=>s.replace(/\s/,"_"))
    const rowValues = rows.map((row)=>row.split(COLUME_SPACE_EXP))
  
    const data = rowValues.map((values)=>{
      return headKeys.reduce((dest, key, index)=>{
        const value = values[index]
        dest[key] = value || null
        return dest 
      }, {})
    })
    return data;
  })
}

async function readNetworks (){
  //todo
}



async function selectContainers ({ message="Please select containers" }={}){
  const data = await readPs()

  if(data.length === 0){
    console.log("No docker container registered")
    return []
  }

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
  
  if(data.length === 0){
    console.log("No docker container registered")
    return []
  }

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




module.exports = {
  readPs,
  readImages,
  readNetworks,
  selectContainers,
  selectImages
}