const runner = require('@sepalang/runner')

const COLUME_SPACE_EXP = /[\s]{3,}/

async function readPs (){
  return runner(async ({ run })=>{
    const { stdout } = await run("docker ps -a", { capture:true })
    const [head, ...rows] = stdout[0].split('\n')
    
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
    const { stdout } = await run("docker images", { capture:true })
    const [head, ...rows] = stdout[0].split('\n')
    
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


module.exports = {
  readPs,
  readImages,
  readNetworks
}