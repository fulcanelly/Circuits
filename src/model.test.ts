import { datasheets, visualToPins } from "./engine"
import { Cell, findWires, PinCell } from "./model"
import * as R from 'ramda'
import { buildPath, isMatch } from './utils'

//todo
// * do not actually rotate
// * do not use cell pins? why this indirection needed ?
// * use index instead of .find
// * fix engine .toPins() function

export const genericWire: Cell = {
    cellType: 'wire',
    position: { x: 0, y: 0 },
    state: {
        rotation: 0,
        wireType: 0,
        powered: false
    }
}

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
        let first: PinCell = visualToPins(
            R.mergeDeepLeft({
                    position: { x: 0, y: 0 },
                    state: { rotation: 1 }
                }, genericWire))

        let second: PinCell = visualToPins(
            R.mergeDeepLeft({
                    position: { x: 1, y: 0 },
                    state: { rotation: 1 },
                    cellType: 'power'
                }, genericWire))

    })


    /**
     *                  =>
     *  x O >   x x x   => x O >   X X X
     *                  =>
     */
    test.todo("NOT should power wire")


    /**
     *                  =>
     *  x O >   x O >   => x O >   X o >
     *                  =>
     */
    test.todo("NOT should power another NOT")
})
