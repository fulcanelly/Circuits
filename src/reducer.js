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

  if (!state.selected.entry) {
    //TODO may be add warning (select item)
    return state
  } 

  const newTile = {
    ...state.selected.entry,
    position: action.pos 
  }


  const cells = [
    newTile, 
    ...state.cells.filter(
      item => JSON.stringify(item.position) != JSON.stringify(newTile.position) 
    )
  ]

  return {
    ...state, cells
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
    [R.propEq('type', 'tile_click'),       handleTileClick],
    [R.propEq('type', 'edit'),         handleToggleEditing],
    [R.propEq('type', 'shift_change'),   handleShiftChange],
    [R.propEq('type', 'scale_change'),    handleMouseWheel],
    [R.propEq('type', 'select_tool'),     handleSelectTool],
    [R.propEq('type', 'tile_hover'),       handleTileHover],
    [R.T, R.always(state)]
  ]
  .map(([cond, handler]) => [cond,  R.curry(handler)(state)]))
    (action)
}