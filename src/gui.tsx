import { useEffect, useRef, useState } from 'react';
import { sendScaleChange, sendSelectTool, sendShiftChange, sendTileClickEvent, sendTileHover, sendToggleEditing } from './reducer';
import { settings } from './settings';
import { Switch } from '@mui/material';
import { notGateEntry, powerSourceEntry, ShowByEntryCircuit, voidEntry, wireEntry } from './circuit';
import { Position } from './model';

//===========================
// Interface
//===========================

//it's a main component which used to setup wheel / mouse move listeners
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

    backgroundColor: '#e1df9b'
  }
  return <div style={style as any}>
    {children}
  </div>
}

// helper function to adjust canvas resolution
export function resizeCanvas(canvas) {
  const { width, height } = canvas.getBoundingClientRect()
  canvas.width = width
  canvas.height = height
}

//main component where all circuits should be located in
export function Grid({ dispatch, children }) {
  const canvasRef = useRef(null)
  const [selected, setSelected] = useState<Position | null>()

  const style = {
    width: `${settings.cellSize * settings.gridSize}px`,
    height: `${settings.cellSize * settings.gridSize}px`,
    position: 'absolute'
  }

  useEffect(() => {
    const canvas = canvasRef.current
    resizeCanvas(canvas)
  }, [])

  const drawMouseHover = ({x, y}) => {

    sendTileHover(dispatch, selected)
    const canvas = canvasRef.current as any
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = 'rgba(74, 132, 151, 0.5)'

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
          style={style as any}
          ref={canvasRef}
        ></canvas>
    </div>
}


///component containing control data
export function Toolbar({dispatch, state}) {
  const style = {
    height: '100px',
    display: 'flex'
  }

  const toggleEditing = () => {
    sendToggleEditing(dispatch)
  }

  return <div style={style}>
    <Switch
      checked={state.mode.editing as any}
      onChange={toggleEditing as any}
      //variant="outlined"
    />
    <ToolSelector
      dispatch={dispatch}
      state={state}
    ></ToolSelector>
  </div>
}


function SelectableItem({selected, onSelect, children}) {
  const style = {
    padding: '10px',
    border: selected ? '3px solid' : '',
    maxHeight: `${settings.cellSize * 1.1}px`
  }

  return <div onClick={onSelect ?? (() => [])} style={style}>
    {children}
  </div>
}


export function ToolSelector({dispatch, state}) {
  const style = {
    display: 'flex',
    flexShrink: '2',
  }

  const entryList = [
    voidEntry(),
    wireEntry(0),
    wireEntry(1),
    wireEntry(2),
    wireEntry(3),
    notGateEntry(),
    powerSourceEntry(),
  ]

  const isSelected = i => (state.selected.index == i)

  return <div style={style}>
      {entryList.map(
        (entry, i) => <SelectableItem
          key={i}
          onSelect={sendSelectTool.bind({}, dispatch, entryList[i], i)}
          selected={isSelected(i)}
          >
            <ShowByEntryCircuit entry={entry}/>
          </SelectableItem>)}
    </div>

}
