module.exports = {
  name:"traefik",
  data:{
    host: "*",
    publishes: [
      [80, 80],
      [443, 443],
      [2202, 2202],
      [3303, 3303],
      [4404, 4404],
      [5505, 5505],
      [6606, 6606],
      [7707, 7707],
      [8808, 8080],
      [9909, 9909]
    ]
  },
  derivedData: async ({ data, helper:{ prompt, confirm } })=>{
    await prompt({
      message:"Traefik Host (default *)",
      validate: (input) => input.length > 0 ? true : "Be sure enter host"
    })
    .then(function(value){
      data.host = !value ? "*" : value
    })

    const usePresetPort = await confirm({
      message:"Would you like to use preset port settings?"
    })

    if(usePresetPort === false){
      const useDefaultPort = await confirm({
        message:"Use default port? (80, 443, 8080)"
      })
      if(useDefaultPort){
        data.publishes = [
          [80, 80],
          [443, 443],
          [8080, 8080]
        ]
      } else {
        data.publishes = []
      }

      await prompt({
        message:"Input additinal ports (with ,)",
        type:"list",
        validate: (list)=>{
          const hasInvalid = list.some(function(input){
            return (/^[0-9]+$/.test(input) && Number(input) > 0 && Number(input) < 65535) ? false : true
          }) 
          return hasInvalid ? "Be sure enter 0~64435" : true
        }
      })
      .then(list=>{
        list.forEach((value)=>{
          const stringValue = Number(value)
          data.publishes.push([stringValue, stringValue])
        })
      })
    }

    console.log(data)
    return await confirm("Is the form entered correctly?")
  },
  prepareCopy:()=>{
    
  }
}