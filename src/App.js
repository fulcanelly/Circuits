import logo from './logo.svg';
import './App.css';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Button, Switch } from '@mui/material';
import { height, margin } from '@mui/system';
import * as R from 'ramda'

const settings = {
  cellSize: 50, 
  gridSize: 6
}


//===========================
// Interface
//===========================


function Field({ dispatch, children }) {

  const [holden, setHolden] = useState(false)

  
  const onMouseDown = (mouseDownEvent) => {
    setHolden(true)
  }

  const onMouseMove = (mouseMoveEvent) => {
    if (!holden) return

    sendShiftChange(dispatch, {
      x: mouseMoveEvent.movementX,
      y: mouseMoveEvent.movementY 
    })

  }

  const onLoseMouse = () => {
    setHolden(false)
  }

  const onMouseWheel = ({deltaY}) => sendScaleChange(dispatch, deltaY)


  const fieldStyle = { 
    backgroundColor: '#b3b6b7',
    width: '100vw',
    height: '100vh'
  }

  return <div
    onMouseDown={onMouseDown} 
    onWheel={onMouseWheel}
    onMouseMove={onMouseMove}
    
    onMouseLeave={onLoseMouse}
    onMouseUp={onLoseMouse}
  
  style={fieldStyle}>{children}</div>
}

 
function MovableField({  state, children }) {
  let shift = state.field.shift

  const style = {
    position: 'relative',
    userDrag: 'none',
    userSelect: 'none',
    transform: `scale(${state.field.scale})`,

    height: `${settings.cellSize * settings.gridSize}px`,
    width: `${settings.cellSize * settings.gridSize}px`,

    top: shift.y,
    left: shift.x,

    backgroundColor: 'red'
  }
  return <div style={style}> 
    {children}
  </div>
}


function resizeCanvas(canvas) {
  const { width, height } = canvas.getBoundingClientRect()
  console.log({
    width, height
  })

  if (canvas.width !== width || canvas.height !== height) {
  //  const { devicePixelRatio:ratio=1 } = window
    let ratio = 1
    const context = canvas.getContext('2d')
    canvas.width = width*ratio
    canvas.height = height*ratio
    context.scale(ratio, ratio)
    return true
  }

  return false
}


function Grid({ dispatch, state, children }) {
  const canvasRef = useRef(null)
  const [selected, setSelected] = useState()

  const style = {
    width: '300px',
    height: '300px',
    position: 'absolute'
  }


  useEffect(() => {
    const canvas = canvasRef.current
    resizeCanvas(canvas)
  }, [])
  
  const drawMouseHover = ({x, y}) => {

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
   
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = '#4a8497'

    const [x_, y_] = [x / 50, y / 50].map(Math.floor)

    ctx.fillRect(
      x_ * settings.cellSize, y_ * settings.cellSize, 
      settings.cellSize, settings.cellSize)

  }
  
  const handleMouseClick = (event) => {
    if (selected) {
      sendTileClickEvent(dispatch, selected)
    }
  }

  const handleMouseLeave = (event) => {
    setSelected(null)
  }

  const handleMouseMove = (event) => {
    const pos = {
      x: event.nativeEvent.layerX,
      y: event.nativeEvent.layerY
    }
    drawMouseHover(pos)
    
    //
    const native = event.nativeEvent
    const [x, y] = [
      native.layerX, native.layerY
    ].map(it => Math.floor(it / settings.cellSize))

    setSelected({x, y})
  }

  return <div
      onMouseMoveCapture={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleMouseClick}>
        {children}
        <canvas 
          style={style}
          ref={canvasRef}
        ></canvas>
    </div> 
}


function Toolbar({dispatch, state}) {
  const style = {
    height: '50px',
  }

  const toggleEditing = () => {
    sendToggleEditing(dispatch)
  }

  return <div style={style}> 
    <Switch
      checked={state.mode.editing}
      onChange={toggleEditing} 
      variant="outlined"
    > </Switch>
  </div>
}

//===========================
// Circuit components
//===========================

function WireCircuit({ rotation, powered, wireType }) {
  const canvasRef = useRef(null)

  const style = {
    width: `${settings.cellSize}px`,
    height: `${settings.cellSize}px`,
    transform: "rotate(90deg)"
  }

  let drawWire = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
   
    ctx.fieldStyle = '#4a8497'
    ctx.fillRect(0, 0, settings.cellSize, settings.cellSize)
    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // ctx.fillStyle = '#4a8497'
  }

  useEffect(drawWire, [])
  
  return <canvas 
    ref={canvasRef}
    style={style}>
  </canvas>
}


function ButtonCircuit({ rotation, pressed }) {
  //TODO
}

function Positioned({pos, children}) {
  const style = {
    position: 'absolute',
    top: `${pos.y * settings.cellSize}px`,
    left: `${pos.x * settings.cellSize}px`
  }  
  return <div style={style}>{children}</div>
}

function PlaceholderCircuit() {
  const style = {
    width: '50px',
    height: '50px',
    backgroundColor: 'blue',
    position: 'absolute'
  }

  return <div style={style}></div>
}

function keyOfCType(citem) {
  return `${citem.x}_${citem.y}`
}


function CircuitComposer({state}) {
  return <div>
    {state.cells.map(
      it => <Positioned key={keyOfCType(it)} pos={it}>
        <PlaceholderCircuit/>
      </Positioned>) }
  </div>
}

//===========================
// State managment
//===========================

let id = 0 


function sendScaleChange(dispatch, deltaY) {
  dispatch({
    type: 'scale_change', deltaY
  })
}

function sendShiftChange(dispatch, diff) {
  dispatch({
    type: 'shift_change', diff
  })
}

function sendTileClickEvent(dispatch, pos) {
  dispatch({
    type: 'tile_click',
    pos: pos,
    id: id++
  })
}


function sendToggleEditing(dispatch) {
  dispatch({
    type: 'edit',
    id: id++ 
  }) 
}


function handleToggleEditing(state, action) {
  return {
    ...state, 
    mode: { 
      ...state.mode, 
      editing: ! state.mode.editing 
    }
  }
}

function handleTileClick(state, action) {
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

function handleMouseWheel(state, action) {
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

function handleShiftChange(state, action) {
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

function defaultReducer(state, action) {

  // if (state.lastId == action.id) {
  //   return state
  // }

  return R.cond([
    [R.propEq('type', 'tile_click'), R.curry(handleTileClick)(state)],
    [R.propEq('type', 'edit'), R.curry(handleToggleEditing)(state)],
    [R.propEq('type', 'shift_change'), R.curry(handleShiftChange)(state)],
    [R.propEq('type', 'scale_change'), R.curry(handleMouseWheel)(state)],
    [R.T, R.always(state)]
  ])(action)

}

//===========================
// App
//===========================


function initState() {
  return {
    mode: {
      editing: false
    },
    
    field: {
      scale: 1, 
      shift: { x: 0, y: 0 }
    },

    cells: [],
  }
}

function App() {

  const [state, dispatch] = useReducer(defaultReducer, initState())

  return <>
      <>{JSON.stringify({state})}</>
      <Toolbar dispatch={dispatch} state={state}></Toolbar>
      <Field dispatch={dispatch} >
        <MovableField state={state}>
          <Grid dispatch={dispatch}>
            <CircuitComposer state={state}></CircuitComposer>
          </Grid>
        </MovableField>
      </Field>
    </>
  }

export default App;
