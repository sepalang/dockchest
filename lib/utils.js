const fs = require('fs')
const path = require('path')
const glob = require('glob')

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

function globPromise (pattern, option={}){
  return new Promise(function(resolve, reject){
    try {
      glob(pattern, option, function(error, files){
        error ? reject(error) : resolve({ files })
      })
    } catch(e){
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
    fs.writeFile(path, data, function(error){
      error ? reject(error) : resolve({ path, data })
    });
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

function pathSplit (pathString){
  if(typeof pathString !== "string"){
    return null
  }
  return pathString.split(path.sep)
}

Object.assign(exports, {
  doit,
  asArray,
  pathJoin,
  pathResolve,
  pathSplit,
  withTimeout,
  matchWhile,
  globPromise,
  readFilePromise,
  writeFilePromise,
  unlinkFilePromise,
  generateUUID,
  nodeLog,
})