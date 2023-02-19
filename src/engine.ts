import * as R from 'ramda'
//import { buildModelOfState } from './nothing';
import { debugEntry, drawShuntWire } from './circuit'
import { Cell, findByPosition, getConnectedTo, getOppositeIndex, NotCell, PinCell, PinIndex, PinInfo, Position, State, updateCells, WireCell } from './model';
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

export function getNeighbours({ x, y }): Position[] {
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


//toPins :: Cell -> State -> Pins

//getCellState :: Cell -> Pins -> State


//suspect:
// 1) input is taken not from around cells but from itself
// 2) input_pins == reverse(output_pins)

export type Datasheet = {
    pattern: any,
    pinInfo: PinInfo[],
    toPins: (cell: any) => PinCell,
    update?: (cells: PinCell[], self: PinCell) => PinCell
  }

// ========================

// ========================

//what pin pinInfo means:
//
//           pinInfo[3]
//               __
//  pinInfo[0]  /_ /  pinInfo[2]
//
//           pinInfo[1]

// bug (?):

//           pinInfo[1]
//               __
//  pinInfo[0]  /_ /  pinInfo[2]
//
//           pinInfo[3]

// ========================

// ========================

export const actualStatePoweredLens = R.lensPath(
    buildPath(_ => _.actual.state.powered))

export const notDatasheet = {
  pattern: {
    cellType: 'not'
  },

  pinInfo: [
    pinTypes.none(),
    pinTypes.output(1),
    pinTypes.none(),
    pinTypes.input(1),
  ],

  // pinInfo: [
  //   pinTypes.none(),
  //   pinTypes.output(1),
  //   pinTypes.none(),
  //   pinTypes.input(1),
  // ],

  //may be powered -> pinCells works wrong(inverted)
  toPins(cell: NotCell) {
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
      position: cell!.position,
      actual: cell,
      rotation,
      pins: rotateTimes(pins, floorMod(rotation, 4))
      // TODO why +2 is needed ?
    }
  },

  update(all: PinCell[], self: PinCell): PinCell {
    const attachedPinValues = getNeighbours(self.position)
      .map(pos => findByPosition(all, pos))
      .map((pcell, index) => pcell?.pins[getOppositeIndex(index)].value)

    const [,out,,input] = rotateReverseTimes(attachedPinValues, floorMod(self.rotation, 4))
   // return R.set(actualStatePoweredLens, true, self)

    return R.set(actualStatePoweredLens, !input, self)
  }

  //???
  // update(cells: PinCell[], self: PinCell): PinCell {
  //   const actualStatePoweredLens = R.lensPath(
  //     buildPath(_ => _.actual.state.powered))

  //   const pinConnections = R.zip(
  //     self.pins, getNearWithTouchingIndex(self.position))//2
  //       .map(([it, against]) => ({ it, against, index: getOppositeIndex(against.touching) }))

  //   const [,input,,out] = rotateReverseTimes(pinConnections, floorMod(self.rotation, 4))


  //   const inputCell = findByPosition(cells, input.against.position)

  //   if (inputCell) {
  //     const value = inputCell.pins[input.index].value
  //     return R.set(actualStatePoweredLens, !value, self)
  //   }

  //   return R.set(actualStatePoweredLens, true, self)
  // }

}


export const datasheets: Datasheet[] = [

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

    toPins(cell: WireCell) {
      try {
        throw new Error()
      }
      catch(e) {
       // console.log(e)
      }
     // console.log("MEOW")

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
      cellType: 'wire',
      state: {
        wireType: 4
      }
    },

    pinInfo: [
      pinTypes.none(),
      pinTypes.none(),
      pinTypes.none(),
      pinTypes.bidirect()
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

  //shunt
  {
    pattern: {
      cellType: 'wire',
      state: {
        wireType: 5
      }
    },

    pinInfo: [
      pinTypes.none(),
      pinTypes.none(),
      pinTypes.none(),
      pinTypes.bidirect()
    ],

    toPins(cell) {
      const pins = this.pinInfo.map(it => {
        if (it.type == 'bidirect') {
          return R.set(valueLens, true, it)
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

  notDatasheet,

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

export function visualToPins(cell: Cell): PinCell {
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

export function updateState(state: State): State {
  const pinsCells = state.cells.map(visualToPins)
  return R.set(cellsLens, updateCells(pinsCells), state)
  // return R.set(
  //   cellsLens, pinsCells.map(R.curry(updater)(pinsCells)), state)
}

