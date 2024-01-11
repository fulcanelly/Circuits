import { visualToPins } from "./engine"
import { Cell, NotCell, State, WireCell, findWires, updateWiresAndGatesInState } from "./model"
import { genericWire, initState } from "./reducer"
import * as R from 'ramda'
import { buildLens } from "./utils"

describe('wire updates', () => {

  describe('when precompile, 2 ticks', () => {
    let precompile = (state: State) => {
      const pinsCells = state.cells.map(visualToPins)
      let [wires, rest] = findWires(pinsCells)

      return R.pipe(
        R.set(buildLens<State>().compiled.gates!._(), rest),
        R.set(buildLens<State>().compiled.wires!._(), wires)
      )(state)

    }
    let subject = updateWiresAndGatesInState

    it("NOT chain should update on every tick", () => {
      const items = new Array(8)
        .fill(0)
        .map((_, i) => ({
          cellType: 'not',
          position: { x: i, y: 0 },
          state: {
            rotation: 1,      //not
            powered: true
          }
        }) as Cell)

      const state = initState()
      state.cells = items

      const precompiled = precompile(state)

      const tick1 = subject(precompiled)

      const tick2 = subject(tick1)
      const tick3 = subject(tick2)
      const tick4 = subject(tick3)
      const tick5 = subject(tick4)

      const lens = R.view(buildLens<Cell>().state.powered!._())

      expect(precompiled.cells.map(lens)).toEqual(
        [true, true, true, true, true, true, true, true]);
      expect(tick1.cells.map(lens)).toEqual(
        [false, false, false, false, false, false, false, true]);
      expect(tick2.cells.map(lens)).toEqual(
        [true, true, true, true, true, true, false, true]);
      expect(tick3.cells.map(lens)).toEqual(
        [false, false, false, false, false, true, false, true]);
      expect(tick4.cells.map(lens)).toEqual(
        [true, true, true, true, false, true, false, true]);
      expect(tick5.cells.map(lens)).toEqual(
        [false, false, false, true, false, true, false, true]);
    })
  })

  describe('when first run', () => {

    let subject: (c: Cell[]) => State = (cells: Cell[]) => {
      const pinsCells = cells.map(visualToPins)
      let [wires, rest] = findWires(pinsCells)

      const result = R.pipe(
        R.set(buildLens<State>().compiled.gates!._(), rest),
        R.set(buildLens<State>().compiled.wires!._(), wires)
      )(initState())

      return updateWiresAndGatesInState({
        ...result, cells
      })
    }

    it("power source should power a wire", () => {
      let first: Cell = R.mergeDeepLeft({
        position: { x: 0, y: 0 },
        state: { rotation: 1 }
      }, genericWire)

      let second: Cell = R.mergeDeepLeft({
        position: { x: 1, y: 0 },
        cellType: 'power'
      }, genericWire)


      let cells = subject([first, second]).cells

      let updatedWire = cells.find(cell => cell.cellType === 'wire') as WireCell

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

      let cells = subject([first, second]).cells

      let updatedWire = cells.find(cell => cell.cellType === 'wire') as WireCell

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

      let cells = subject([first, second]).cells

      let updatedNot = cells.find(cell => (cell as any).id === 1) as NotCell

      expect(updatedNot.state.powered).toBe(false)

    })
  })


})
