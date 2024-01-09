//===========================
// State managment
//===========================
import * as R from 'ramda'
import { updateState } from './engine'
import { Cell, NotCell, Position, State, WireCell } from './model'
import { buildLens, buildPath } from './utils'

export const genericWire: Cell = {
  cellType: 'wire',
  position: { x: 0, y: 0 },
  state: {
      rotation: 0,
      wireType: 0,
      powered: false
  }
}

let id = 0

function startingCells(): Cell[] {

  return []
}


// TODO

const events = {

  toggle_editing: {
    send(dispatch: React.Dispatch<Action>) {
    },

    handle() {

    }
  }
}


//init state
export function initState(): State {
  return {
    mode: {
      editing: false
    },

    field: {
      scale: 1,
      shift: { x: 0, y: 0 }
    },

    cells: startingCells(),

    selected: {
      index: null,
      entry: null
    },

   hovered: null
    //pick:
  }
}

//TODO
export type Action = {
    type: string
    [rest: string]: any
  }

type SelectToolAction = {
    type: 'select_tool',
    entry: Cell,
    index: number
  }


export function sendSelectTool(dispatch: React.Dispatch<Action>, entry: Cell, index: number) {
  dispatch({
    type: 'select_tool',
    entry, index
  })
}


export function sendCellsUpdate(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: 'cells_update'
  })
}

export function sendScaleChange(dispatch: React.Dispatch<Action>, deltaY: number) {
  dispatch({
    type: 'scale_change', deltaY
  })
}

export function sendShiftChange(dispatch: React.Dispatch<Action>, diff: Position) {
  dispatch({
    type: 'shift_change', diff
  })
}

export function sendTileHover(dispatch: React.Dispatch<Action>, pos: Position | undefined) {
  dispatch({
    type: 'tile_hover', pos
  })
}

export function sendTileClickEvent(dispatch: React.Dispatch<Action>, pos: Position) {
  dispatch({
    type: 'tile_click',
    pos: pos,
    id: id++
  })
}

export function sendToggleEditing(dispatch: React.Dispatch<Action>) {
  dispatch({
    type: 'edit',
    id: id++
  })
}

export function handleTileHover(state: State, action: Action): State {
  return R.set(
    R.lensPath(['hovered']), action.pos, state)
}

export const stateLens = buildLens<State>

function handleSelectTool(state: State, action: Action): State {
  return R.pipe(
    R.set(stateLens().selected.entry._(), action.entry),
    R.set(stateLens().selected.index._(), action.index))
    (state)
}

export function handleToggleEditing(state: State, action: Action): State {
  const modeEditingLens = buildLens<State>().mode.editing._()

  let lastEditingState = R.view(modeEditingLens, state)
  return R.set(modeEditingLens, !lastEditingState, state)
}

export function handleTileClick(state: State, action: Action): State {
  if (!state.mode.editing) {
    return state
  }

  if (!state.selected.entry) {
    //TODO may be add warning (select item)
    return state
  }

  //void is special tile type so it means remove current tile
  if (state.selected.entry.cellType === 'void') {
    const cells = [
      ...state.cells.filter(
        item => JSON.stringify(item.position) !== JSON.stringify(action.pos)
      )
    ]

    return {
      ...state, cells
    }
  } else {
    //else add tile of that type

    const newTile = {
      ...state.selected.entry,
      position: action.pos
    }

    const cells = [
      newTile,
    //  genDebugCellFor(action.pos),
     // ...genDebugCellsFor(action.pos),
      ...state.cells.filter(
        item => JSON.stringify(item.position) !== JSON.stringify(action.pos)
      )
    ]

    return {
      ...state, cells
    }
  }
}


function handleMouseWheelEditing(state: State, action: Action): State {
  if (state.hovered) {
    //find needed cell
    const cell = state.cells.find(
      item => JSON.stringify(state.hovered)
        === JSON.stringify(item.position)
      )

    //get index of found cell
    let index = state.cells.indexOf(cell as any)

    if (index < 0) {
      return state
    }

    //get lens
    let rotationLens = R.lensPath<State, number>(
      buildPath<State>(_ => _.cells[index].state.rotation)
    )

    let mutation = (x) =>
      (x + Math.sign(action.deltaY))

    return R.over(rotationLens, mutation, state)
  }

  return state
}

export function handleMouseWheel(state: State, action: Action): State {

  if (state.mode.editing) {
    return handleMouseWheelEditing(state, action)
  } else {
    const deltaY = action.deltaY
    const fieldScaleLens = buildLens<State>().field.scale._()

    const getNewScale = () => {
      let currentScale = state.field.scale

      if (deltaY > 0) {
        return currentScale * 1.1
      } else {
        return currentScale * 0.9
      }
    }

    return R.set(
      fieldScaleLens, getNewScale(), state)
  }

}

export function handleShiftChange(state: State, action: Action): State {
  if (state.mode.editing) return state

  const fieldStateLens = buildLens<State>().field.shift._()

  const oldShift = R.view(fieldStateLens, state)

  const update = {
    x: action.diff.x + oldShift.x,
    y: action.diff.y + oldShift.y
  }

  return R.set(fieldStateLens, update, state)
}


export function handleCellsUpdate(state: State, action: Action): State {
  return updateState(state)
}

export function defaultReducer(state: State, action: Action): State {
  const template = {
    tile_click: handleTileClick,
    edit: handleToggleEditing,
    shift_change: handleShiftChange,
    scale_change: handleMouseWheel,
    select_tool: handleSelectTool,
    tile_hover: handleTileHover,
    cells_update: handleCellsUpdate
  }

  return Object.entries(template)
    .map(([event, handler]) => ({event, handler}))
    .find(pair => pair.event === action.type)
    ?.handler(state, action)!
}
