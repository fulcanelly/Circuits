//===========================
// State managment
//===========================
import * as R from 'ramda'
import { updateState } from './engine'
import { Cell, NotCell, State, WireCell } from './model'
import { buildPath } from './utils'

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
  return [first, second]
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


export function sendSelectTool(dispatch, entry, index) {
  dispatch({
    type: 'select_tool',
    entry, index
  })
}


export function sendCellsUpdate(dispatch) {
  dispatch({
    type: 'cells_update'
  })
}

function handleSelectTool(state, action) {
  let selectedIndexLens = R.lensPath(
    buildPath(_ => _.selected.index))

  let selectedEntryLens = R.lensPath(
    buildPath(_ => _.selected.entry))

  return R.set(
    selectedEntryLens, action.entry, R.set(
      selectedIndexLens, action.index, state))
}

export function sendScaleChange(dispatch, deltaY) {
  dispatch({
    type: 'scale_change', deltaY
  })
}

export function sendShiftChange(dispatch, diff) {
  dispatch({
    type: 'shift_change', diff
  })
}

export function sendTileHover(dispatch, pos) {
  dispatch({
    type: 'tile_hover', pos
  })
}

export function handleTileHover(state, action) {
  return R.set(
    R.lensPath(['hovered']), action.pos, state)
}

export function sendTileClickEvent(dispatch, pos) {
  dispatch({
    type: 'tile_click',
    pos: pos,
    id: id++
  })
}

export function sendToggleEditing(dispatch) {
  dispatch({
    type: 'edit',
    id: id++
  })
}

export function handleToggleEditing(state: State, action) {
  const modeEditingLens = R.lensPath(
    buildPath(_ => _.mode.editing)
  )

  let lastEditingState = R.view(modeEditingLens, state)
  return R.set(modeEditingLens, !lastEditingState, state)
}

export function handleTileClick(state: State, action) {
  if (!state.mode.editing) {
    return state
  }

  if (!state.selected.entry) {
    //TODO may be add warning (select item)
    return state
  }

  //void is special tile type so it means remove current tile
  if (state.selected.entry.cellType == 'void') {
    const cells = [
      ...state.cells.filter(
        item => JSON.stringify(item.position) != JSON.stringify(action.pos)
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
        item => JSON.stringify(item.position) != JSON.stringify(action.pos)
      )
    ]

    return {
      ...state, cells
    }
  }
}


function handleMouseWheelEditing(state, action) {
  if (state.hovered) {
    //find needed cell
    const cell = state.cells.find(
      item => JSON.stringify(state.hovered)
        == JSON.stringify(item.position)
      )

    //get index of found cell
    let index = state.cells.indexOf(cell)

    if (index < 0) {
      return state
    }

    //get lens
    let rotationLens = R.lensPath(
      buildPath(_ => _.cells[index].state.rotation)
    )

    let mutation = (x) =>
      (x + Math.sign(action.deltaY))

    return R.over(rotationLens, mutation, state)
  }

  return state
}

export function handleMouseWheel(state, action) {

  if (state.mode.editing) {
    return handleMouseWheelEditing(state, action)
  } else {
    const deltaY = action.deltaY

    const fieldScaleLens = R.lensPath(
      buildPath(_ => _.field.scale)
    )

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

export function handleShiftChange(state, action) {
  if (state.mode.editing) return state

  const fieldStateLens = R.lensPath(
    buildPath(_ => _.field.shift)
  )

  const oldShift = R.view(fieldStateLens, state)

  const update = {
    x: action.diff.x + oldShift.x,
    y: action.diff.y + oldShift.y
  }

  return R.set(fieldStateLens, update, state)
}


export function handleCellsUpdate(state: State, action): State {
  return updateState(state)
}

export function defaultReducer(state: State, action) {
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
    .find(pair => pair.event == action.type)
    ?.handler(state, action)
}
