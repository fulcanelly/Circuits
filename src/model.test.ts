import { datasheets, visualToPins } from "./engine"
import { Cell, findWires, PinCell } from "./model"
import * as R from 'ramda'
import { buildPath, isMatch } from './utils'

//todo
// * do not actually rotate
// * do not use cell pins? why this indirection needed ?
// * use index instead of .find
// * fix engine .toPins() function

const genericWire: Cell = {
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

describe("model ", () => {
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
        let first: PinCell = visualToPins(
            R.set(
                builtLens(_ => _.position),
                { x: 0, y: 0 },
                genericWire))

        let second: PinCell = visualToPins(
            R.set(
                builtLens(_ => _.position),
                { x: 0, y: 1 },
                genericWire))

        let [wires, _] = findWires([first, second])

        expect(wires[0].cells.length).toBe(2)
    })

    it("should construct two wires ", () => {
        let first: PinCell = visualToPins(
            R.set(
                builtLens(_ => _.position),
                { x: 0, y: 0 },
                genericWire))

        let second: PinCell = visualToPins(
            R.set(
                builtLens(_ => _.position),
                { x: 0, y: 2 },
                genericWire))

        let [wires, _] = findWires([first, second])

        expect(wires.length).toBe(2)
    })

    /**
     *
     * x x x   x x x
     *
     */
    it("should construct wire from two rotated wire cells", () => {
        let first: PinCell = visualToPins(
            R.mergeDeepLeft({
                    position: { x: 0, y: 0 },
                    state: { rotation: 1 }
                }, genericWire))

        let second: PinCell = visualToPins(
            R.mergeDeepLeft({
                    position: { x: 1, y: 0 },
                    state: { rotation: 1 }
                }, genericWire))

        let [wires, _] = findWires([first, second])

        expect(wires.length).toBe(1)
        expect(wires[0].cells.length).toBe(2)
    })

    test.todo("should construct wire from two bend wire cells")

    test.todo("should power wire")
})
