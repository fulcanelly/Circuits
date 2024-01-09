
import * as R from 'ramda'
import { Position, State } from './model'
import { Action } from './reducer'
import { Merge } from './mege'

//**
//  *
//  * @param {*} handler
//  * @returns
//  */

type rec = Record<string, any>

type ProxyType<T extends rec> = { [K in keyof Merge<T>]-?: ProxyType<T[K]> }


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
export function buildPath<T extends rec>(handler: (proxy: ProxyType<T>) => any): (string | number)[] {
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

type LensBuilderProxyType<T extends rec, StartType>
  = { [K in keyof Merge<T>]: LensBuilderProxyType<T[K], StartType> }
  & {
    _: () => R.Lens<StartType, T>
  }


export function buildLens<T extends rec>(): LensBuilderProxyType<T, T> {
  let path: Array<string> = [];
  let proxy = new Proxy({}, {
    get(target, prop, receiver) {
      if (prop === '_') {
        return () => R.lensPath(path);
      }
      path.push(prop as string);
      return proxy;
    }
  });
  return proxy as LensBuilderProxyType<T, T>;
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
