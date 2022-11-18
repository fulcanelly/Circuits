//===========================
// State managment
//===========================
import * as R from 'ramda'
import { set } from 'ramda'
import { buildPath } from './utils'

let id = 0 


//init state
export function initState() {
  return {
    mode: {
      editing: false
    },
    
    field: {
      scale: 1, 
      shift: { x: 0, y: 0 }
    },

    cells: [],

    //pick:
  }
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

export function handleToggleEditing(state, action) {
  const modeEditingLens = R.lensPath(
    buildPath(_ => _.mode.editing)
  )

  let lastEditingState = R.view(modeEditingLens, state)
  return R.set(modeEditingLens, !lastEditingState, state)
}

export function handleTileClick(state, action) {
  if (!state.mode.editing) {
    return state
  }

  return {
    ...state, 
    cells: R.uniqWith(
      R.eqBy(JSON.stringify), 
      [...state.cells, action.pos])
  }
}

export function handleMouseWheel(state, action) {
  if (state.mode.editing) return state

  const deltaY = action.deltaY
  const fieldScaleLens = R.lensPath(
    buildPath(_ => _.field.scale)
  )

  function getNewScale() {
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

export function defaultReducer(state, action) {
  return R.cond([
    [R.propEq('type', 'tile_click'), R.curry(handleTileClick)(state)],
    [R.propEq('type', 'edit'), R.curry(handleToggleEditing)(state)],
    [R.propEq('type', 'shift_change'), R.curry(handleShiftChange)(state)],
    [R.propEq('type', 'scale_change'), R.curry(handleMouseWheel)(state)],
    [R.T, R.always(state)]
  ])(action)
}