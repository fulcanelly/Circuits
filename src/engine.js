import * as R from 'ramda'
import { debugEntry } from './circuit'
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
 
export function rotateTimes(arr, times = 1) {
  let result = arr
  for (let index = 0; index < times; index++) {
    result = R.move(0, -1, result)
  }
  return result
}

export function rotateReverseTimes(arr, times = 1) {
  let result = arr 
  for (let index = 0; index < times; index++) {
    result = R.move(-1, 0, result)
  }
  return result
}


const pinTypes = new class {
  output(id) {
    return {type: 'output'}
  }

  bidirect(id) {
    return {type: 'bidirect'}
  }

  input(id) {
    return {type: 'input'}
  }
  
  none() {
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

export function getNearWithTouchingIndex(pos) {
  const near = getNeighbours(pos)
  const touching = [ 2, 3, 0, 1 ]
  return R.zip(near, touching)
    .map(([position, touching]) => ({ position, touching }))
}

let cellsLens = R.lensPath(
  buildPath(_ => _.cells)
)

function cellDotsFromVisual(visual) {
  let datasheet = datasheets.find(data => isMatch(data.pattern, visual))
  //datasheet.pinInfo
}

const datasheets = [
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
        position: cell.position,
        actual: cell,
        rotation,
        pins: rotateTimes(pins, floorMod(rotation, 4))
      }
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

function getInputs(cell) {
  let datasheet = datasheets.find(data => isMatch(data.pattern, cell))
  if (datasheet) {
    let pins = rotateTimes(cell.state.rotation, datasheet.pinInfo)

    
  } else {
    throw "hz what to do"
  }
}


export function visualToPins(cell) {
  const datasheet = findDatasheet(cell)
  return datasheet.toPins(cell)
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

  return R.set(
    cellsLens, pinsCells.map(R.curry(updater)(pinsCells)), state)
}


const positionLens = R.lensPath(
  buildPath(_ => _.position)
)

// debug-purpose-only functions

export function copyPositionedAt(entry, position) {
  return R.set(positionLens, position, entry)
}

export function genDebugCellsFor(pos) {
  return getNeighbours(pos)
    .map(position => copyPositionedAt(
        debugEntry(position), position))
}

export function genDebugCellFor(pos) {
  return getNeighbours(pos)
    .map(position => copyPositionedAt(
        debugEntry(position), position))[2]
}

