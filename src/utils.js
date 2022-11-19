

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
