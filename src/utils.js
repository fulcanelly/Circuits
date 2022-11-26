
import * as R from 'ramda'

//**
//  * 
//  * @param {*} handler 
//  * @returns 
//  */

/**

 *  Helper function for ramda lenses
 *  
 *  @example <caption>Instead of writing</caption>  
 *  R.lensPath(['a', 'b', 'c']}
 * 
 *  @example <caption>I prefer</caption> 
 *  R.lensPath(buildPath(_ => _.a.b.c))
 *  
 * @param {(proxy: Proxy) => Proxy} handler 
 * @returns {[string | number]}
 */
export function buildPath(handler) {
  let path = []
  let proxy = new Proxy(path, {
    get(target, string, recv) {
      target.push(string)
      return proxy
    }
  })
  handler(proxy)
  return path.map(item => isNaN(item) ? item : Number(item)) 
}

export function isMatch(pattern, object) {
  if (!object) {
    return false
  }

  const checker = ([key, value]) => {
    if (value instanceof Object) {
      return isMatch(value, object[key])
    } else {
      return R.equals(object[key], value)
    }
  }

  return R.all(
    R.equals(true), 
    Object.entries(pattern)
      .map(checker))
}