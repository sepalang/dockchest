const fs = require('fs')
const path = require('path')
const glob = require('glob')
const cons = require('consolidate')
const cloneDeep = require('clone-deep')
const runner = require('@sepalang/runner')
const mkdirp = require('mkdirp')

function isNone (data){
  return (data === undefined) || (data === null) || (data !== data)
}

function isArray (data){
  return Array.isArray(data)
}

function asArray (data){
  if(isArray(data)){
    return data
  }
  if(isNone(data)){
    return []
  }
  return [data]
}

function doit(fn, args){
  return typeof fn === 'function' ? fn(...asArray(args)) : undefined
}

const browse = (obj, path) => {
  const pathString = Array.isArray(path) ? path.join('.') : path
  const keys = String.prototype.split.call(pathString, /[,[\].]+?/).filter(Boolean)
  const result = []
  keys.reduce((parent, key, depth) => {
    if (parent && typeof parent === 'object') {
      const value = parent[key]
      result.push({ parent, key, depth, value })
      return value
    } else {
      result.push({ parent, key, depth, value: undefined })
      return undefined
    }
  }, obj)
  return result
}

// lodash.set 과 같음
const set = (obj, path, setValue) => {
  const [result] = browse(obj, path).reverse()
  if (!result) return
  const { parent, key } = result
  if (parent && typeof parent === 'object') {
    parent[key] = setValue
  }
}

// lodash.get 과 같음
const get = (obj, path) => {
  const [result] = browse(obj, path).reverse()
  return result ? result.value : undefined
}


function withTimeout(wait){
  if (typeof wait === 'undefined'){
    wait = 0
  }
  if (typeof wait !== 'number') {
    throw new Error('withTimeout::wait time must be number')
  }
  return function(result){
    return new Promise(function(resolve){
      setTimeout(function(){ resolve(result) }, wait);
    });
  }
}

function cloneRegexp (regexpInstance){
  const source = regexpInstance.source
  const option = [
    (regexpInstance.ignoreCase ? 'i' : ''),
    (regexpInstance.global ? 'g' : ''),
    (regexpInstance.multiline ? 'm' : ''),
    (regexpInstance.sticky ? 'y' : ''),
  ].join('')
  return new RegExp(source, option)
}

function matchWhile (regexp, content, callback){
  const matchRegexp = cloneRegexp(regexp)
  const result = []
  let execResult = null
  do {
    execResult = matchRegexp.exec(content)
    execResult && (result.push(execResult) || (typeof callback === "function" && callback(execResult)))
  } while(execResult !== null)
  return result
}

function recyclePromise (recycleFn, entryValue){
  return new Promise(function(resolve, reject){
    let fullfill = false
    function nextCycle (value, index){
      let endScope = false
      recycleFn({
        value,
        index,
        resolve (){
          if(fullfill === true || endScope === true) return;
          fullfill = endScope = true
          resolve(value)
        },
        reject (){
          if(fullfill === true || endScope === true) return;
          fullfill = endScope = true
          reject(error)
        },
        recycle (passValue){
          if(fullfill === true || endScope === true) return;
          endScope = true;
          nextCycle(passValue, index+1)
        }
      })
    }
    nextCycle(entryValue, 0)
  })
}

// function arrayMapPromise(array:Array|Promise<Array>, mapFn:Function)
// arrayMapPromise(['foo', 'bar'], (path)=>promisifyReadFile(path))
// arrayMapPromise(glob.async('./*.json'), (path)=>promisifyReadFile(path))
function arrayMapPromise (array, mapFn){
  return Promise.resolve(array).then(function(data){
    return typeof mapFn === "function" ? Promise.all(asArray(data).map(function(datum, index){
      return mapFn(datum, index);
    })) : data
  })
}


function globPromise (pattern, option={}){
  return new Promise(function(resolve, reject){
    try {
      glob(pattern, option, function(error, files){
        if(error){
          reject(error)
        } else {
          const { sep } = path
          resolve(sep !== "/" ? files.map((path)=>path.replace(/\//g,sep)) : files)
        }
      })
    } catch(e){
      console.log(e)
      reject(e)
    }
  });
}

function readFilePromise(path, encode = 'utf-8'){
  return new Promise(function(resolve, reject){
    fs.readFile(path, encode, function(error, data){
      error ? reject(error) : resolve(data)
    });
  });
}

function writeFilePromise(path, data){
  return new Promise(function(resolve, reject){
    mkdirp(pathDirname(path))
    .then(function(){
      fs.writeFile(path, data, function(error){
        error ? reject(error) : resolve({ path, data })
      });
    })
    
  });
}

function unlinkFilePromise(path){
  return new Promise(function(resolve, reject){
    fs.stat(path, function (error) {
      if (error) {
        if(error.code === "EEXSIST"){
          resolve()
        } else {
          reject(error)
        }
      }
      fs.unlink(path, function(error){
        error ? reject(error) : resolve()
      });
   });
  });
}


function entriesOfCopyFiles (originalDir, originalFiles, copyDir){
  return asArray(originalFiles).map((originalFilePath)=>{
    if(originalFilePath.indexOf(originalDir) === 0){
      const originalFileRelativePath = originalFilePath.substr(originalDir.length)
      return [originalFilePath, path.resolve(copyDir, originalFileRelativePath.replace(/^[\\]+/, ()=>""))]
    } else {
      return [originalFilePath, path.resolve(copyDir, originalFilePath)]
    }
  })
}

function renderEJS(originalPath, data){
  const renderData = { ...data, $data:cloneDeep(data), $util:{ asArray } }
  return cons.ejs(originalPath, renderData)
}

function generateUUID (pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'){
  return pattern.replace(/[xy]/g, function (c){
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 3) | 8 // eslint-disable-line no-mixed-operators
    return v.toString(16)
  })
}

function nodeLog (it){
  return require('util').inspect(it, false, null, true)
}

function pathJoin (...pathString){
  return path.join(...pathString)
}

function pathResolve (entry, payload){
  return path.resolve(entry, payload)
}

function pathDirname (pathString){
  return path.dirname(pathString)
}

function pathSplit (pathString){
  if(typeof pathString !== "string"){
    return null
  }
  return pathString.split(path.sep)
}

function baseNextPromise (array, fn){
  const queues = asArray(array)
  const result = Array.from(queues)
  const rootPromise = Promise.resolve()
  let prepare = rootPromise

  queues.forEach(function(value){
    prepare = prepare.then(function(pass){
      return new Promise(function(next, reject){
        fn({
          value,
          pass,
          next,
          reject,
        })
      })
    })
  })
  prepare = prepare.then(function(){ return result })
  return prepare
}

function sequentialMapPromise(array, fn, firstPass){
  const queues = asArray(array).map(function(payload, index){
    return { payload, index, resolved:undefined }
  })
  return baseNextPromise(queues, function({ value, next }){
    try {
      const { payload, index } = value
      const tryFn = fn(payload, index)
      Promise
      .resolve(tryFn)
      .then(function(resolvedValue){
        value.resolved = resolvedValue
        next(resolvedValue)
      })
    } catch(error){
      return Promise.reject(error)
    }
  }, firstPass)
  .then(function(seriesResults){
    return seriesResults.map(function(res){
      return res.resolved
    })
  })
}

async function loadHelper (){
  const { run, confirm, prompt, select } = await runner()
  return {
    doit,
    run, 
    confirm,
    prompt,
    select,
    recyclePromise,
  }
}

Object.assign(exports, {
  cloneDeep,
  doit,
  browse,
  get,
  set,
  asArray,
  pathJoin,
  pathResolve,
  pathSplit,
  withTimeout,
  recyclePromise,
  matchWhile,
  arrayMapPromise,
  globPromise,
  readFilePromise,
  writeFilePromise,
  unlinkFilePromise,
  entriesOfCopyFiles,
  renderEJS,
  sequentialMapPromise,
  generateUUID,
  nodeLog,
  loadHelper,
})