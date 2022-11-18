//===========================
// State managment
//===========================
import * as R from 'ramda'

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
  return {
    ...state, 
    mode: { 
      ...state.mode, 
      editing: ! state.mode.editing 
    }
  }
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

  function getNewScale() {
    let currentScale = state.field.scale

    if (deltaY > 0) {
      return currentScale * 1.1
    } else {
      return currentScale * 0.9
    }
  }

  return {
    ...state,
    field: {
      ...state.field,
      scale: getNewScale()
    }
  } 
}

export function handleShiftChange(state, action) {
  if (state.mode.editing) return state

  return {
    ...state,
    field: {
      ...state.field,
      shift: {
        x: action.diff.x + state.field.shift.x,
        y: action.diff.y + state.field.shift.y
      }
    }
  }
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