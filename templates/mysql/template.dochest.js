const cloneDeep = require("clone-deep")

module.exports = {
  name:"mysql",
  data:{
    type: "",
    host: "*",
    port: "",
    rootPassword: "",
    users: [],
    useTraefik: false,
  },
  derivedData:async ({ data, helper:{ select, prompt, confirm } })=>{
    await select({
      message: "Mysql template type",
      options:[
        {
          label:"default",
          value:"default",
        },
        {
          label:"traefik",
          value:"traefik",
        }
      ]
    }).then(([ selected ])=>{
      data.type = selected
      data.useTraefik = selected === "traefik"
    })
    
    await prompt({
      message:"root user password",
      type:"password",
      validate: (input) => input.length > 0 ? true : "Be sure enter password"
    })
    .then(function(value){
      data.rootPassword = value
    })

    if(data.useTraefik){
      await prompt({
        message:"Traefik Host (default *)",
        validate: (input) => input.length > 0 ? true : "Be sure enter host"
      })
      .then(function(value){
        data.host = !value ? "*" : value
      })
    }

    await prompt({
      message:"Port number",
      validate: (input)=> (/^[0-9]+$/.test(input) && Number(input) > 0 && Number(input) < 65535) ? true : "Be sure enter 0~64435"
    })
    .then(function(value){
      data.port = value
    })

    await prompt({
      message:"Enter additional users (with ,)",
      type: "list"
    })
    .then(function(value){
      data.users = value
    })
    
    const trace = cloneDeep(data)
    trace.rootPassword = trace.rootPassword.replace(/./g, "*")
    console.log(trace)
    return await confirm("Is the form entered correctly?")
  },
  prepareCopy:()=>{
    
  }
}