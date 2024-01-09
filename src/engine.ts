import * as R from 'ramda'
//import { buildModelOfState } from './nothing';
import { debugEntry, drawShuntWire } from './circuit'
import { Cell, findByPosition, getConnectedTo, getOppositeIndex, NotCell, PinCell, PinIndex, PinInfo, Position, State, updateCellsNToActuall, WireCell } from './model';
import { buildLens, buildPath, isMatch } from './utils'


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

export function getNearWithTouchingIndex(pos: Position): Array<{ position: Position, touching: PinIndex }> {
  const near = getNeighbours(pos)
  const touching = [ 2, 3, 0, 1 ]
  return R.zip(near, touching)
    .map(([position, touching]) => ({ position, touching } as { position: Position, touching: PinIndex }))
}

let cellsLens = buildLens<State>().cells._()

const valueLens = buildLens<PinInfo>().value!._()

//toPins :: Cell -> State -> Pins

//getCellState :: Cell -> Pins -> State


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

// ========================

// ========================


// buildLens<PinCell>().actual.state.

export const actualStatePoweredLens = buildLens<PinCell>().actual.state.powered?._()!


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

  toPins(cell: NotCell) {
    const pins = this.pinInfo.map(it => {
      if (it.type === 'output') {
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
    }
  },

  update(all: PinCell[], self: PinCell): PinCell {
    const attachedPinValues = getNeighbours(self.actual.position)
      .map(pos => findByPosition(all, pos))
      .map((pcell, index) => pcell?.pins[getOppositeIndex(index)].value)

    const [,out,,input] = rotateReverseTimes(attachedPinValues, floorMod(self.actual.state.rotation, 4))

    return R.set(actualStatePoweredLens, !input, self)
  }

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

export function findDatasheet(cell: Cell): Datasheet | undefined {
  return datasheets.find(data => isMatch(data.pattern, cell))
}

export function visualToPins(cell: Cell): PinCell {
  return findDatasheet(cell)!.toPins(cell)
}


export function updateState(state: State): State {
  const pinsCells = state.cells.map(visualToPins)
  return R.set(cellsLens, updateCellsNToActuall(pinsCells), state)
}

