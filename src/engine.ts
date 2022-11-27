import * as R from 'ramda'
//import { buildModelOfState } from './nothing';
import { debugEntry } from './circuit'
import { Cell, findByPosition, getConnectedTo, getOppositeIndex, PinCell, PinIndex, PinInfo, Position, updateCells } from './model';
import { buildPath, isMatch } from './utils'


// needed for rotation
export function floorMod(a, n) {
  // Type casting is necessary
  // as (int) / (int) will give
  // int result, i.e. -3 / 2
  // will give -1 and not -1.5
  let q = Math.floor(Math.floor(a / n));

  // Return the resultant remainder
  return a - n * q;
}
//const s =buildModelOfState

export function rotateTimes<T>(arr: T[], times: number = 1): T[] {
  let result = arr
  for (let index = 0; index < times; index++) {
    result = R.move(0, -1, result)
  }
  return result
}

const a = R.identity(1)

export function rotateReverseTimes<T>(arr: T[], times: number = 1): T[] {
  let result = arr 
  for (let index = 0; index < times; index++) {
    result = R.move(-1, 0, result)
  }
  return result
}


const pinTypes = new class {
  output(id: any = null): PinInfo {
    return {type: 'output'}
  }

  bidirect(id: any = null): PinInfo {
    return {type: 'bidirect'}
  }

  input(id: any = null): PinInfo {
    return {type: 'input'}
  }
  
  none(id: any = null): PinInfo {
    return {type: 'none'}
  }
}

//WARN
//TODO: lifetime  
// set -> compile -> update loop
//                  ^       /
//                   \ ----

function makeHandler({pattern, pinInfo, handler}) {
}


//what pin pinInfo means:
// 
//           pinInfo[3]
//               __
//  pinInfo[0]  /_ /  pinInfo[2]
//               
//           pinInfo[1]

// 0 - 2 = floorMod(x + 2, 4)
// 1 - 3
// 2 - 0
// 3 - 1

/**
 * 
 * @param {{x: number, y: number}} position 
 * @returns {[{x: number, y: number}]}
 */
export function getNeighbours({ x, y }) {
  return [
      [ -1,  0  ],
      [  0,  1  ],
      [  1,  0  ],
      [  0, -1  ]
  ]
  .map(([x, y]) => ({ x, y }))
  .map(
    R.evolve({
      x: R.add(x),
      y: R.add(y)}))
}


// need it since bug
// TODO solve
export function getNeighbours2(pos: Position): Position[]{
  return [
    [  1,  0  ],
    [  0, -1  ],
    [ -1,  0  ],
    [  0,  1  ],
  ]
  .map(([x, y]) => ({ x, y }))
  .map(
    R.evolve({
      x: R.add(pos.x),
      y: R.add(pos.y)}))
}

export function getNearWithTouchingIndex2(pos: Position): Array<{ position: Position, touching: PinIndex }> {
  const near = getNeighbours2(pos)
  const touching = [ 2, 3, 0, 1 ]
  return R.zip(near, touching)
    .map(([position, touching]) => ({ position, touching } as { position: Position, touching: PinIndex }))
}

export function getNearWithTouchingIndex(pos: Position): Array<{ position: Position, touching: PinIndex }> {
  const near = getNeighbours(pos)
  const touching = [ 2, 3, 0, 1 ]
  return R.zip(near, touching)
    .map(([position, touching]) => ({ position, touching } as { position: Position, touching: PinIndex }))
}

let cellsLens = R.lensPath(
  buildPath(_ => _.cells)
)

function cellDotsFromVisual(visual) {
  let datasheet = datasheets.find(data => isMatch(data.pattern, visual))
  //datasheet.pinInfo
}


const valueLens = R.lensPath(
    buildPath(_ => _.value))



export type Datasheet = {
    pattern: any,
    pinInfo: PinInfo[],
    toPins: (cell: any) => PinCell,
    update?: (cells: PinCell[], self: PinCell) => PinCell 
  }

//TODO: apply DRY
const datasheets: Datasheet[] = [
  
  {
    pattern: {
      cellType: 'wire', 
      state: {
        wireType: 0
      }
    }, 
      
    pinInfo: [
      pinTypes.none(),
      pinTypes.bidirect(1),
      pinTypes.none(),
      pinTypes.bidirect(1),
    ],


    toPins(cell) {
      const pins = this.pinInfo.map(it => ({
        ...it,
        value: it.type == 'bidirect' ? Boolean(cell.state.powered) : false 
      }))

      const rotation = Number(cell.state.rotation);

      return {
        data: this,
        position: cell.position,
        actual: cell,
        rotation,
        pins: rotateTimes(pins, floorMod(rotation, 4))
      }
    }

  },
  
  {
    pattern: {
      cellType: 'wire', 
      state: {
        wireType: 1
      }
    }, 

    pinInfo: [
      pinTypes.bidirect(1),
      pinTypes.none(),
      pinTypes.none(),
      pinTypes.bidirect(1),
    ],

    toPins(cell) {
      const pins = this.pinInfo.map(it => {
        if (it.type == 'bidirect') {
          return R.set(valueLens, Boolean(cell.state.powered), it)
        } else {
          return it
        }
      })

      const rotation = Number(cell.state.rotation)
      
      return {
        data: this,
        position: cell.position,
        actual: cell,
        rotation,
        pins: rotateTimes(pins, floorMod(rotation, 4))
      }
    }
  },

  {
    pattern: {
      cellType: 'wire', 
      state: {
        wireType: 2
      }
    }, 

    pinInfo: [
      pinTypes.bidirect(1),
      pinTypes.bidirect(1),
      pinTypes.none(),
      pinTypes.bidirect(1),
    ],

    toPins(cell) {
      const pins = this.pinInfo.map(it => {
        if (it.type == 'bidirect') {
          return R.set(valueLens, Boolean(cell.state.powered), it)
        } else {
          return it
        }
      })

      const rotation = Number(cell.state.rotation)
      
      return {
        data: this,
        position: cell.position,
        actual: cell,
        rotation,
        pins: rotateTimes(pins, floorMod(rotation, 4))
      }
    }
  },

  {
    pattern: {
      cellType: 'wire', 
      state: {
        wireType: 3
      }
    }, 

    pinInfo: [
      pinTypes.bidirect(1),
      pinTypes.bidirect(1),
      pinTypes.bidirect(1),
      pinTypes.bidirect(1),
    ],

    toPins(cell) {
      const pins = this.pinInfo.map(it => {
        if (it.type == 'bidirect') {
          return R.set(valueLens, Boolean(cell.state.powered), it)
        } else {
          return it
        }
      })

      const rotation = Number(cell.state.rotation)
      
      return {
        data: this,
        position: cell.position,
        actual: cell,
        rotation,
        pins: rotateTimes(pins, floorMod(rotation, 4))
      }
    }
  },

  {
    pattern: {
      cellType: 'not'
    },

    pinInfo: [
      pinTypes.none(),
      pinTypes.input(1),
      pinTypes.none(),
      pinTypes.output(1),
    ],

    toPins(cell) {
      const pins = this.pinInfo.map(it => {
        if (it.type == 'output') {
          return R.set(valueLens, Boolean(cell.state.powered), it)
        } else {
          return it
        }
      })
      const rotation = Number(cell.state.rotation)

      return {
        data: this,
        position: cell.position,
        actual: cell,
        rotation,
        pins: rotateTimes(pins, floorMod(rotation, 4))
      }
    }, 

    update(cells: PinCell[], self: PinCell): PinCell {
      const actualStatePoweredLens = R.lensPath(
        buildPath(_ => _.actual.state.powered)) 
      
      const idk = R.zip(
        self.pins, getNearWithTouchingIndex2(self.position))
          .map(([it, against]) => ({ it, against, index: getOppositeIndex(against.touching) }))
      
      const [,input,,out] = rotateReverseTimes(idk, floorMod(self.rotation, 4))


      const inputCell = findByPosition(cells, input.against.position)

      if (inputCell) {
        const value = inputCell.pins[input.index].value
        return R.set(actualStatePoweredLens, !value, self)
      } 

      return R.set(actualStatePoweredLens, true, self)
    }

  },

  {
    pattern: {
      cellType: 'power'
    },

    pinInfo: [
      pinTypes.output(),
      pinTypes.output(),
      pinTypes.output(),
      pinTypes.output()
    ],

    toPins(cell) {
      const pins = this.pinInfo.map(it => ({
        ...it, value: true
      }))

      return {
        data: this,
        position: cell.position,
        actual: cell,
        rotation: 0,
        pins
      }
    }
  }



]



export function findDatasheet(cell) {
  return datasheets.find(data => isMatch(data.pattern, cell))
}


export function visualToPins(cell) {
  return findDatasheet(cell)!.toPins(cell)
}

    
const statePoweredLens = R.lensPath(
    buildPath(_ => _.state.powered)
  )

const updater = (pinsCells, cell) => {
  if (isMatch(datasheets[0].pattern, cell.actual)) {
    const around = getNearWithTouchingIndex(cell.position) 
      .map(neighbour => {
        const foundCell = pinsCells.find(pcell => R.equals(pcell.position, neighbour.position))
        if (foundCell) {
          return foundCell.pins[neighbour.touching].value
        } else {
          return false
        }
      }) 

      const [_, a, __, b] = rotateReverseTimes(around, cell.rotation)
      
      if (a || b) {
        return R.set(statePoweredLens, true, cell.actual)
      } else {
        return R.set(statePoweredLens, false, cell.actual)
      }
  } 

  if (cell.actual.cellType == 'power') {
    //console.log("WA!")

    return cell.actual
  }

  throw 'idk'
}

/**
 * 
 * @param {{cells: [any]}} state 
 * @returns {{cells: [any]}}
 */
export function updateState(state) {
  const pinsCells = state.cells.map(visualToPins)
  return R.set(cellsLens, updateCells(pinsCells), state)
  return state


  // return R.set(
  //   cellsLens, pinsCells.map(R.curry(updater)(pinsCells)), state)
}


const positionLens = R.lensPath(
  buildPath(_ => _.position)
)

// debug-purpose-only functions

export function copyPositionedAt(entry, position) {
  return R.set(positionLens, position, entry)
}

// export function genDebugCellsFor(pos) {
//   return getNeighbours(pos)
//     .map(position => copyPositionedAt(
//         debugEntry(position), position))
// }

// export function genDebugCellFor(pos) {
//   return getNeighbours(pos)
//     .map(position => copyPositionedAt(
//         debugEntry(position), position))[2]
// }

