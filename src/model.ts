
import { initState } from "./reducer"
import * as R from 'ramda'
import { actualStatePoweredLens, Datasheet, floorMod, getNearWithTouchingIndex, visualToPins } from "./engine"
import { buildLens } from "./utils"

export type Mode = {
        editing: boolean
    }


export type Field = {
        scale: number,
        shift: Position
    }

export type State = {
        mode: Mode
        cells: Cell[],
        compiled: {
            wires?: Wire[],
            gates?: PinCell[]
        }
        field: Field,
        selected: {
            index: number | null,
            entry: Cell | null
        }
        hovered: Position | null
    }

export type Position = { x: number, y: number }


export type CellBase = {
    position: Position// | null
    state: {
        rotation: number
    }
}

export type VoidCell ={
        cellType: 'void'
    } & CellBase

export type WireType =  0 | 1 | 2 | 3

export type WireCell = {
        cellType: 'wire'
        state: {
            wireType: WireType
            powered: boolean
        }
    }  & CellBase

export type PowerCell = {
        cellType: 'power'
    } & CellBase

export type NotCell = {
        cellType: 'not',
        state: {
            powered: boolean
        }
    } & CellBase

export type Cell = (PowerCell | WireCell | NotCell | VoidCell) & CellBase


export type Input = {
        pinIndex: PinIndex,
        position: Position
    }


export type Wire = {
        cells: PinCell[]
        inputs: Input[]
       // powered: boolean
    }



//TODO Composed

export type PinInfo = {
        type: 'output' | 'input' | 'none' | 'bidirect'
        value?: boolean | null
    }

export type PinCell = {
        actual: Cell
        pins: PinInfo[]
        data: Datasheet
    }


export type PinIndex = 0 | 1 | 2 | 3


export function getOppositeIndex(x: number) {
    return floorMod(x + 2, 4)
}


export function findByPosition(pool: PinCell[], pos: Position): PinCell | undefined {
    return pool.find(cell => R.equals(cell.actual.position, pos))
}

export type ConnectionType = {
        position: Position;
        touching: PinIndex;
        found: PinCell;
    }

export function getConnectedTo(pool: PinCell[], center: PinCell): ConnectionType[] {
    return getNearWithTouchingIndex(center.actual.position)
        .map(near => {
            return {
                found: pool.find(cell => R.equals(cell.actual.position, near.position))!,
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
    }

    while (queue.length) {
        getConnectedTo(rest, queue.shift()!)
            .forEach(cell => {
                //group by
                if (cell.found.actual.cellType === 'wire') {
                    wire.cells.push(cell.found)
                    queue.push(cell.found)
                } else {
                    wire.inputs.push({
                        pinIndex: (cell.touching) as PinIndex,
                        position: cell.position
                    })
                }
            })

        rest = R.without(wire.cells, rest)
    }

    return [wire, R.without(wire.cells, pinCells)]

}

export function findWires(tiles: PinCell[]): [Wire[], PinCell[]] {
    //todo .filter wire
    let wires: Wire[] = []
    while (tiles.find(p => p.actual.cellType === 'wire')) {
        let wire
        [wire, tiles] = getWire(tiles)
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

function pinCellToCell(cells: PinCell[]): Cell[] {
    return cells.map(it => it.actual)
}

export function updateWiresAndGatesInState(state: State): State {
    const { gates, wires } = state.compiled

    const updatedWires: Wire[] = []
    const updatedGates: PinCell[] = []
    const total: PinCell[] = []

    for (const wire of wires!) {
        const powered = wire.inputs.some(input => getValueAt(gates!, input))

        const wireTiles = wire.cells
            .map(R.set(actualStatePoweredLens, powered))
            .map(it => it.data.toPins(it.actual))

        total.push(...wireTiles)

        updatedWires.push(
            R.set(buildLens<Wire>().cells._(), wireTiles, wire)
        )
    }

    const totalCopy = [ ...total, ...gates! ]

    for (const gate of gates!) {
        const updatedGate = gate.data.update?.(totalCopy, gate) ?? gate
        total.push(updatedGate.data.toPins(updatedGate.actual))
        updatedGates.push(updatedGate.data.toPins(updatedGate.actual))
    }


    return R.pipe(
        R.set(buildLens<State>().compiled.gates!._(), updatedGates),
        R.set(buildLens<State>().compiled.wires!._(), updatedWires),
        R.set(buildLens<State>().cells._(), pinCellToCell(total))
        )(state)
}

