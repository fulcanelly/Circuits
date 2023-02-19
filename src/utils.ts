
import * as R from 'ramda'

//**
//  *
//  * @param {*} handler
//  * @returns
//  */
type ProxyType = {[key: string]: ProxyType }


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
 *
 */
export function buildPath(handler: (proxy: ProxyType) => ProxyType): (string | number)[] {
  let path: Array<string | number> = []
  let proxy = new Proxy(path, {
    get(target, string: string, recv) {
      target.push(string)
      return proxy
    }
  })
  handler(proxy)
  return path.map(item => isNaN(item as any) ? item : Number(item))
}



export function isMatch(pattern: any, object: any): boolean {
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
