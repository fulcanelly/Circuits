
import { initState } from "./reducer"
import * as R from 'ramda'
import { floorMod, getNearWithTouchingIndex } from "./engine"



type Position = { x: number, y: number }


type CellBase = {
    position: Position
    state: {
        rotation: number
    }
    cellType: string
}


type WireType =  0 | 1 | 2 | 3

type WireCells = {
        cellType: 'wire'
        state: {
            wireType: WireType
            powered: boolean
        }
    }

type PowerCell = {
        cellType: 'power'
    }

type Cell = (PowerCell | WireCells) & CellBase


type Input = {
        pinIndex: PinIndex,
        position: Position
    }


type Wire = {
        cells: PinCell[]
        inputs: Input[] 
        powered: boolean
    }



//TODO Composed

type PinInfo = {
        type: 'output' | 'input' | 'none' | 'bidirect' 
        value: boolean | null 
    }

type PinCell = {
        position: Position
        actual: Cell
        rotation: number 
        pins: [PinInfo, PinInfo, PinInfo, PinInfo]
    }


type PinIndex = 0 | 1 | 2 | 3

//TODO in type change 'touching to 'index
function getNearWithTouchingIndexTs(pos: Position): Array<{ position: Position, touching: PinIndex }> {
    return getNearWithTouchingIndex(pos as any) as any
}



function getOppositeIndex(x: number) {
    return floorMod(x + 2, 4)
}


type ConnectionType = {
        position: Position;
        touching: PinIndex;
        found: PinCell;
    }

function getConnectedTo(pool: PinCell[], center: PinCell): ConnectionType[] {
    return getNearWithTouchingIndexTs(center.position)
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
                        pinIndex: cell.touching,// null as any,
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

    console.log(wires)
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
    let result: Cell[] = []

    result.push(...pinCellToCell(rest))

    for (let wire of wires) {
        const powered = wire.inputs.some(
            input => getValueAt(rest, input)
        )
        console.log({powered})

        wire.powered = powered

        const wireTiles = wire.cells.map(cell => {
            return R.set(actualStatePoweredLens, powered, cell)
        }) 

        result.push(...pinCellToCell(wireTiles))
    }

    return result


}
