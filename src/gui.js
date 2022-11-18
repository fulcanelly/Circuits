import { useEffect, useReducer, useRef, useState } from 'react';
import { sendScaleChange, sendShiftChange, sendTileClickEvent, sendToggleEditing } from './reducer';
import { settings } from './settings';
import { Button, Switch } from '@mui/material';

//===========================
// Interface
//===========================

//it's a main component which used to setup scale / move listeners 
export function Field({ dispatch, children }) {
  const [holden, setHolden] = useState(false)
  
  const onMouseDown = (mouseDownEvent) => {
    setHolden(true)
  }
  
  const onLoseMouse = () => {
    setHolden(false)
  }

  const onMouseMove = (mouseMoveEvent) => {
    if (!holden) return

    sendShiftChange(dispatch, {
      x: mouseMoveEvent.movementX,
      y: mouseMoveEvent.movementY 
    })
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

//component which receives scale & shift transformations
export function MovableField({ state, children }) {
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



// helper function to adjust canvas resolution
export function resizeCanvas(canvas) {
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

//main component where all circuits should be located in
export function Grid({ dispatch, children }) {
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


///component containing control data 
export function Toolbar({dispatch, state}) {
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