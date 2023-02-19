import { actualStatePoweredLens, datasheets, floorMod, getNeighbours, notDatasheet, rotateReverseTimes, rotateTimes, visualToPins } from "./engine"
import { Cell, findByPosition, findWires, getOppositeIndex, NotCell, PinCell, PowerCell, updateCells, WireCell } from "./model"
import * as R from 'ramda'
import { buildPath, isMatch } from './utils'
import { genericWire } from "./reducer"
import { notGateEntry, powerSourceEntry } from "./circuit"

//todo
// * do not actually rotate
// * do not use cell pins? why this indirection needed ?
// * use index instead of .find
// * fix engine .toPins() function
// * todo debug cell
// * get rid of pin cells

type ProxyType = {[key: string]: ProxyType }

function builtLens(handler: (proxy: ProxyType) => ProxyType) {
    return R.lensPath(buildPath(handler))
}

const helpers = {

    cells2PinCells(cells: Cell[]): PinCell[] {
        return cells.map(visualToPins)
    }

}

describe("model", () => {
    it("should convert pins to cell pin", () => {
        let wire: Cell = {
            cellType: 'wire',
            position: { x: 0, y: 0 },
            state: {
                rotation: 0,
                wireType: 0,
                powered: false
            }
        }

        let expected = {
            position: { x: 0, y: 0 },
            actual: wire,
            data: datasheets[0],
            pins:[
                {
                    type: "none",
                    value: false
                },
                {
                    type: "bidirect",
                    value: false
                },
                {
                    type: "none",
                    value: false
                },
                {
                    type: "bidirect",
                    value: false
                }
            ],
            rotation: 0
        }

        expect(visualToPins(wire)).toStrictEqual(expected)
    })

    /**
     *  x
     *  x
     *  x
     *
     *  x
     *  x
     *  x
     */
    it("should construct one wire from two staright wires cells", () => {
        let first: Cell = R.set(
            builtLens(_ => _.position),
            { x: 0, y: 0 },
            genericWire)

        let second: Cell = R.set(
            builtLens(_ => _.position),
            { x: 0, y: 1 },
            genericWire)

        let [wires, _] = findWires(helpers.cells2PinCells([first, second]))

        expect(wires[0].cells.length).toBe(2)
    })

    it("should construct two wires ", () => {
        let first: Cell = R.set(
            builtLens(_ => _.position),
            { x: 0, y: 0 },
            genericWire)

        let second: Cell = R.set(
            builtLens(_ => _.position),
            { x: 0, y: 2 },
            genericWire)

        let [wires, _] = findWires(helpers.cells2PinCells([first, second]))

        expect(wires.length).toBe(2)
    })

    /**
     *
     * x x x   x x x
     *
     */
    it("should construct wire from two rotated wire cells", () => {
        let first: Cell = R.mergeDeepLeft({
                position: { x: 0, y: 0 },
                state: { rotation: 1 }
            }, genericWire)

        let second: Cell = R.mergeDeepLeft({
                position: { x: 1, y: 0 },
                state: { rotation: 1 }
            }, genericWire)

        let [wires, _] = findWires(helpers.cells2PinCells([first, second]))

        expect(wires.length).toBe(1)
        expect(wires[0].cells.length).toBe(2)
    })

    /**
     *   x
     *   x x   x x
     *           x
     */
    //todo visualize
    it("should construct wire from two bend wire cells", () => {
        let first: Cell = R.mergeDeepLeft({
                position: { x: 0, y: 0 },
                state: {
                    rotation: 1,
                    wireType: 1
                }
            }, genericWire)

        let second: Cell = R.mergeDeepLeft({
                position: { x: 1, y: 0 },
                state: {
                    rotation: 3,
                    wireType: 1
                }
            }, genericWire)

        let [wires, _] = findWires(helpers.cells2PinCells([first, second]))

        expect(wires.length).toBe(1)
        expect(wires[0].cells.length).toBe(2)
    })

    /**
     *          o o o   =>           o o o
     *  x x x   o   o   =>   X X X   o   o
     *          o o o   =>           o o o
     */
    it("power source should power a wire", () => {
        let first: Cell = R.mergeDeepLeft({
                position: { x: 0, y: 0 },
                state: { rotation: 1 }
            }, genericWire)

        let second: Cell = R.mergeDeepLeft({
                position: { x: 1, y: 0 },
                cellType: 'power'
            }, genericWire)

        let cells = updateCells(
            helpers.cells2PinCells([first, second]))

        let updatedWire = cells.find(cell => cell.cellType == 'wire') as WireCell

        expect(updatedWire.state.powered).toBe(true)
    })

    /**
     *                  =>
     *  x O >   x x x   => x O >   X X X
     *                  =>
     */
    it("NOT should power wire", () => {
        let first: Cell = {
            cellType: 'not',
            position: { x: 1, y: 0 },
            state: {
                rotation: 1, //TODO WHY?
                powered: true
            }
        }

        let second: Cell = {
            cellType: 'wire',
            position: { x: 0, y: 0 },
            state: {
                rotation: 1,
                wireType: 0,
                powered: false
            }
        }

        let cells = updateCells(
            helpers.cells2PinCells([first, second]))

        let updatedWire = cells.find(cell => cell.cellType == 'wire') as WireCell

        expect(updatedWire.state.powered).toBe(true)
    })

    /**
     *                  =>
     *  x O >   x O >   => x O >   X o >
     *                  =>
     */
    it("NOT should power another NOT", () => {
        let first: any = {
            id: 1,
            cellType: 'not',
            position: { x: 0, y: 0 },
            state: {
                rotation: 1,
                powered: true
            }
        }
        let second: any = {
            id: 2,
            cellType: 'not',
            position: { x: 1, y: 0 },
            state: {
                rotation: 1,      //not
                powered: true
            }
        }

        let cells = updateCells(
            helpers.cells2PinCells([first, second]))

        let updatedNot = cells.find(cell => (cell as any).id == 1) as NotCell

        expect(updatedNot.state.powered).toBe(false)

    })

    /**
     *
     * O O O     x    =>    O O O     X    <- test this pin
     * O   O   x x    =>    O   O   X X
     * O O O          =>    O O O   ^
     *                               \_ this as well
     */

    test.todo("toPins should return right values")
    /**
     *     [1]
     * [0]     [2]
     *     [3]
     *
     * [1] -> ! -> [3]
     */
    it("NOT should invert value", () => {
        let power: PowerCell = {
            cellType: 'power',
            position: { x: 0, y: 0 },
            state: { rotation: 0 }
        }

        let not: NotCell = {
            cellType: 'not',
            position: { x: 0, y: 0 },
            state: {
                rotation: 0,
                powered: true
            }
        }


    })
})


describe("not datasheet", () => {
    const subject = notDatasheet


    it("should present", () => {
        expect(subject != null).toBe(true)
    })

    /***
     *
     *  power src
     *     |        =>   (not gate).state.powered == false
     *  not gate
     */
    it("#update(power cell, not gate) should update {not gate} to false", () => {
        const power: PowerCell = R.mergeDeepLeft({
                position: { x : 0, y: 0 }
            }, powerSourceEntry())


        const self: NotCell = R.mergeDeepLeft({
                position: { x: 0, y: 1 }
            }, notGateEntry())


        const updated = subject?.update?.([visualToPins(power)], visualToPins(self)).actual as NotCell
        //const updated = stubUpdateNotGate([visualToPins(power)], visualToPins(self)).actual as NotCell

        expect(updated.state.powered).toBe(false)
    })

    /***
     *  power src - not gate  =>   (not gate).state.powered == false
     */
    it("#update(power cell, not gate) should update {not gate} to false [another position & rotation]", () => {
        const power: PowerCell = R.mergeDeepLeft({
                position: { x : 1, y: 0 }
            }, powerSourceEntry())


        const self: NotCell = R.mergeDeepLeft({
                position: { x: 0, y: 0 },
                state: { rotation: 1 } //TODO: WHY 3 ?
            }, notGateEntry())


        const updated = subject.update([visualToPins(power)], visualToPins(self)).actual as NotCell

        //const updated = stubUpdateNotGate([visualToPins(power)], visualToPins(self)).actual as NotCell

        expect(updated.state.powered).toBe(false)
    })

    it("#update(another not gate, not gate) should update {not gate} to false", () => {
        const another_not: NotCell = R.mergeDeepLeft({
                position: { x : 0, y: 0 }
            },  notGateEntry())


        const self: NotCell = R.mergeDeepLeft({
                position: { x: 0, y: 1 }
            }, notGateEntry())

        const updated = subject?.update?.([visualToPins(another_not)], visualToPins(self)).actual as NotCell
       // const updated = stubUpdateNotGate([visualToPins(another_not)], visualToPins(self)).actual as NotCell

        expect(updated.state.powered).toBe(false)
    })

    it("#toPins(powered not gate) should be valid", () => {
        const cell: NotCell = {
            position: null as any,
            state: {
              rotation: 0,
              powered: true
            },
            cellType: 'not'
        }

        const pins = subject.toPins(cell).pins

        expect(pins[0].value != true).toBe(true)
        expect(pins[1].value != true).toBe(true)
        expect(pins[2].value != true).toBe(true)
        expect(pins[3].value).toBe(true)
    })


    it("#toPins(off not gate) should be valid", () => {
        const cell: NotCell = {
            position: null as any,
            state: {
              rotation: 0,
              powered: false
            },
            cellType: 'not'
        }

        const pins = subject.toPins(cell).pins

        expect(pins[0].value != true).toBe(true)
        expect(pins[1].value != true).toBe(true)
        expect(pins[2].value != true).toBe(true)
        expect(pins[3].value != true).toBe(true)
    })

    it("#toPins(not gate) should be valid [rotation 1]", () => {
        const cell: NotCell = {
            position: null as any,
            state: {
              rotation: 1,
              powered: true
            },
            cellType: 'not'
        }

        const pins = subject.toPins(cell).pins

        // expect(pins[0].value != true).toBe(true)
        // expect(pins[1].value != true).toBe(true)
        // expect(pins[2].value != true).toBe(true)
        expect(pins[2].value).toBe(true)
    })
})

describe("utils", () => {
    it("rotateTimes([0, 1, 2, 3], 1) should be [1, 2, 3, 0]", () => {
        const input = [0, 1, 2, 3]
        const output = [1, 2, 3, 0]

        expect(rotateTimes(input, 1)).toStrictEqual(output)
    })


    it("rotateTimes(arr, n)[x] should be same as arr[floorMod(n + x, arr.length)], 0 ≤ x < arr.length, n >= 0", () => {
        const arr = [0, 1, 2, 3]

        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < arr.length; j++) {
                const n = i
                const x = j

                const a = floorMod(n, arr.length)
                const b = floorMod(x, arr.length)

                expect(rotateTimes(arr, n)[x]).toBe(arr[floorMod(n + x, arr.length)])
            }
        }
    })


})
