
import { initState } from "./reducer"
import * as R from 'ramda'
import { Datasheet, floorMod, getNearWithTouchingIndex } from "./engine"


export type Position = { x: number, y: number }


export type CellBase = {
    position: Position
    state: {
        rotation: number
    }
    cellType: string
}


export type WireType =  0 | 1 | 2 | 3

export type WireCells = {
        cellType: 'wire'
        state: {
            wireType: WireType
            powered: boolean
        }
    }

export type PowerCell = {
        cellType: 'power'
    }


export type Cell = (PowerCell | WireCells) & CellBase


export type Input = {
        pinIndex: PinIndex,
        position: Position
    }


export type Wire = {
        cells: PinCell[]
        inputs: Input[] 
        powered: boolean
    }



//TODO Composed

export type PinInfo = {
        type: 'output' | 'input' | 'none' | 'bidirect' 
        value?: boolean | null 
    }

export type PinCell = {
        position: Position
        actual: Cell
        rotation: number 
        pins: PinInfo[]
        data: Datasheet
    }


export type PinIndex = 0 | 1 | 2 | 3


export function getOppositeIndex(x: number) {
    return floorMod(x + 2, 4)
}


export function findByPosition(pool: PinCell[], pos: Position): PinCell | undefined {
    return pool.find(cell => R.equals(cell.position, pos))
}

export type ConnectionType = {
        position: Position;
        touching: PinIndex;
        found: PinCell;
    }

export function getConnectedTo(pool: PinCell[], center: PinCell): ConnectionType[] {
    return getNearWithTouchingIndex(center.position)
        .map(near => {
            return {
                found: pool.find(cell => R.equals(cell.position, near.position))!,
                ...near
            }
        })
        .filter(near => {   
            const found = near.found //pool.find(cell => R.equals(cell.position, near.position))
            
            if (!found) {
                return false 
            }

            return R.all(
                pin => ['bidirect', 'output', 'input'].includes((pin.type)), 
                [found.pins[near.touching], center.pins[getOppositeIndex(near.touching)]])
      
        }) 

}


function findWireCell(tiles: PinCell[]): PinCell {
    return tiles.find(p => p.actual.cellType == 'wire')!
}

function getWire(pinCells: PinCell[]): [Wire | null, PinCell []] {
    let rest = [...pinCells]
    let start = findWireCell(pinCells)

    let queue = [start]

    let wire: Wire = {
        cells: [start],
        inputs: [],
        powered: false,
    }

    while (queue.length) {  
        getConnectedTo(rest, queue.shift()!)
            .forEach(cell => {

                if (cell.found.actual.cellType == 'wire') {
                    wire.cells.push(cell.found)
                    queue.push(cell.found)
                    rest = R.without(wire.cells, pinCells)
                } else {
                    wire.inputs.push({
                        pinIndex: getOppositeIndex(cell.touching) as PinIndex,
                        position: cell.position 
                    })
                }

            }) 
    }

    return [wire, R.without(wire.cells, pinCells)]

}


export function findWires(tiles: PinCell[]): [Wire[], PinCell[]]{
    let wires: Wire[] = []
    while (tiles.find(p => p.actual.cellType == 'wire')) {   
        let [wire, tilesUpd] = getWire(tiles)
        tiles = tilesUpd 
        if (wire) {
            wires.push(wire)
        }
    }

    return [wires, tiles]
}


export function getValueAt(cells: PinCell[], input: Input): boolean {
    const samePosition = cell => R.equals(cell.position, input.position)
    return cells.find(samePosition)?.pins[input.pinIndex].value!
}

function pinCellToCell(cells) {
    return cells.map(it => it.actual)
}

const actualStatePoweredLens = R.lensPath(["actual", "state", "powered"])

export function updateCells(cells: PinCell[]): Cell[] {
    let [wires, rest] = findWires(cells)
    let result: PinCell[] = []


    for (let wire of wires) {
        const powered = wire.inputs.some(
            input => getValueAt(rest, input)
        )

        wire.powered = powered

        const wireTiles = wire.cells.map(cell => {
            return R.set(actualStatePoweredLens, powered, cell)
        }) 

        result.push(...wireTiles)
    }

    result.push(...rest)

    const resultCopy = [...result]
    for (const i in resultCopy) {
        
        const gate = resultCopy[i]
        
        if (gate.data.update) {
            result[i] = gate.data.update?.(resultCopy, gate) 
        }

    }


    return pinCellToCell(result)


}
