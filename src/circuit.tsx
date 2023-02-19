import React, { useEffect, useRef } from 'react';
import { settings } from './settings';
import * as R from 'ramda'
import CSS from 'csstype';
import { NotCell, PowerCell } from './model';

//===========================
// Circuit components
//===========================

//==============================
// Common canvas tile utils
//==============================

function fillCellBackground(ctx, color = settings.colors.background) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, settings.cellSize, settings.cellSize)
}

function adjustTileCanvasSize(canvasRef) {
  let current = canvasRef.current
  current.width = settings.cellSize
  current.height = settings.cellSize
}

//==============================
// Circuit // Write components
//==============================


export function getCanvasCtx(ref) {
  const canvas = ref.current
  return canvas.getContext('2d')
}

const sizes = [
  0.4, 0.2, 0.4
].map(R.multiply(settings.cellSize))


export function drawStraightWire(ctx, color) {
  fillCellBackground(ctx)
  ctx.fillStyle = color

  ctx.fillRect(sizes[0], 0, sizes[1], settings.cellSize)
}

export function drawCrossWire(ctx, color) {
  fillCellBackground(ctx)
  ctx.fillStyle = color

  //wire along y axis
  ctx.fillRect(sizes[0], 0, sizes[1], settings.cellSize)

  //wire along x axis
  ctx.fillRect(0, sizes[0], settings.cellSize, sizes[1])
}

export function drawThreeWayWire(ctx, color) {
  fillCellBackground(ctx)
  ctx.fillStyle = color

  //wire along y axis
  ctx.fillRect(sizes[0], 0, sizes[1], settings.cellSize)

  //wire along x axis
  ctx.fillRect(0, sizes[0], settings.cellSize / 2, sizes[1])
}

export function draw90DegBendWire(ctx, color) {
  fillCellBackground(ctx)
  ctx.fillStyle = color

  ctx.fillRect(sizes[0], 0, sizes[1], settings.cellSize * 0.6)

  ctx.fillRect(0, sizes[0], settings.cellSize * 0.6, sizes[1])
}


export function drawShuntWire(ctx, color) {
  fillCellBackground(ctx)
  ctx.fillStyle = color

  ctx.fillRect(sizes[0], 0, sizes[1], settings.cellSize * 0.6)
}

export function drawPowerSource(ctx) {
  fillCellBackground(ctx, settings.colors.idleWire)

  const cellSize = settings.cellSize

  ctx.fillStyle = settings.colors.poweredWire

  const length = (1 - 0.2 * 2) * cellSize


  ctx.fillRect(
    0.2 * cellSize, 0.2 * cellSize, length, length
  )

}

function cellSizeStyles() {
  return {
    width: `${settings.cellSize + 1}px`,
    height: `${settings.cellSize + 1}px`,
  }
}

function rotationToTransform(rotation) {
  let deg = (rotation % 4) * 90
  return `rotate(${deg}deg)`
}

export function Void({}) {
  const canvasRef = useRef(null)

  const style = {
    ...cellSizeStyles(),
  }

  useEffect(() => {
    adjustTileCanvasSize(canvasRef)
    fillCellBackground(getCanvasCtx(canvasRef))
  },[])

  return <canvas
    ref={canvasRef}
    style={style}>
  </canvas>
}


export function PowerSource({}) {
  const canvasRef = useRef(null)

  const style = {
    ...cellSizeStyles(),
  }

  useEffect(() => {
    adjustTileCanvasSize(canvasRef)
    drawPowerSource(getCanvasCtx(canvasRef))
  },[])

  return <canvas
    ref={canvasRef}
    style={style}>
  </canvas>
}


export function DebugTile({state}) {
  return <p>{JSON.stringify(state)}</p>
}


function drawNotGate(ctx, powered = false) {
  fillCellBackground(ctx, settings.colors.background)
  ctx.fillStyle = settings.colors.idleWire

  ctx.fillRect(sizes[0], 0, sizes[1], settings.cellSize)

  ctx.strokeStyle = settings.colors.idleWire
  const cellSize = settings.cellSize


  //outer triangle

  ctx.beginPath()
  ctx.fillStyle = settings.colors.idleWire

  ctx.lineWidth = 7
  let path = new Path2D()
  path.moveTo(0.1 * cellSize, 0.1 * cellSize) //left corner <
  path.lineTo(cellSize / 2, cellSize * 0.7)  //bottom center

  path.lineTo((1 - 0.1) * cellSize, 0.1 * cellSize)  //right corner >
  path.lineTo(0.1 * cellSize, 0.1 * cellSize) //left corner <

  path.lineTo(cellSize / 2, cellSize * 0.7) //bottom center
  ctx.fill(path)

  //outer circle
  ctx.beginPath();

  const radius = 7
  ctx.arc(cellSize / 2, cellSize * 0.7, radius, 0, 2 * Math.PI);
  ctx.stroke()

  //inner circle
  if (powered) {
    ctx.fillStyle = settings.colors.poweredWire
  } else {
    ctx.fillStyle = settings.colors.background
  }

  ctx.beginPath()
  ctx.arc(cellSize / 2, cellSize * 0.7, radius * 0.8, 0, 2 * Math.PI)
  ctx.fill()

}

export function NotGateCircuit({ state: { rotation, powered } }) {
  const canvasRef = useRef(null)

  //console.log(rotation)
  const style = {
    ...cellSizeStyles(),
    transform: rotationToTransform(rotation ?? 0)
  }

  useEffect(() => {
    adjustTileCanvasSize(canvasRef)
    drawNotGate(getCanvasCtx(canvasRef), powered)

  }, [])

  return <canvas
      ref={canvasRef}
      style={style}>
    </canvas>
}

export function WireCircuit({ state: { powered, wireType, rotation} }) {
  const canvasRef = useRef(null)

  const style = {
    ...cellSizeStyles(),
    transform: rotationToTransform(rotation ?? 0)
  }

  const wireTypes = [
    drawStraightWire,
    draw90DegBendWire,
    drawThreeWayWire,
    drawCrossWire,
    drawShuntWire,
    drawShuntWire,
  ]

  const color = powered ?
    settings.colors.poweredWire :
    settings.colors.idleWire

  useEffect(() => {
    adjustTileCanvasSize(canvasRef)
    wireTypes[wireType](getCanvasCtx(canvasRef), color)
  },[])

  return <canvas
    ref={canvasRef}
    style={style}>
  </canvas>
}


export function ButtonCircuit({ rotation, pressed }) {
  //TODO
}

// helper component used to place circuit in right spot
export function Positioned({pos, children}) {
  const style: CSS.Properties = {
    position: 'absolute',
    top: `${pos.y * settings.cellSize}px`,
    left: `${pos.x * settings.cellSize}px`
  }
  return <div style={style} >{children}</div>
}


// just temporary circuit NOP component
export function PlaceholderCircuit() {
  const style: CSS.Properties = {
    width: '50px',
    height: '50px',
    backgroundColor: 'blue',
    position: 'absolute'
  }

  return <div style={style}></div>
}

/// entries
export function wireEntry(wireType) {
  const result =  {
    position: null,
    state: {
      rotation: 0,
      powered: false,
      wireType,
    },
    cellType: 'wire',
  }

  if (wireType == 5) {
    result.state.powered = true
  }

  return result
}

export function voidEntry() {
  return {
    position: null,
    state: {
      rotation: null,
    },
    cellType: 'void'
  }
}

export function powerSourceEntry(): PowerCell {
  return {
    position: null as any,
    state: {
      rotation: 0
    },
    cellType: 'power'
  }
}

export function notGateEntry(): NotCell {
  return {
    position: null as any,
    state: {
      rotation: 0,
      powered: true
    },
    cellType: 'not'
  }
}

export function debugEntry(i = 'NaN') {
  return {
    position: null,
    state: {
      i
    },
    cellType: 'debug'
  }
}

// component responsible for dispatching circuit
export function ShowByEntryCircuit({entry}) {
  if (entry.cellType == 'wire') {
    return <WireCircuit state={entry.state}></WireCircuit>
  }
  if (entry.cellType == 'power') {
    return <PowerSource/>
  }
  if (entry.cellType == 'void') {
    return <Void/>
  }
  if (entry.cellType == 'not') {
    return <NotGateCircuit state={entry.state}></NotGateCircuit>
  }
  if (entry.cellType == 'debug') {
    return <DebugTile state={entry.state}/>
  }

  return <></>
}


// helper to identify circuit components by it's entry
export function keyOfCType(entry) {
  return JSON.stringify(entry)
}

// component responsible for placing circuit in the right point
export function CircuitComposer({state}) {
  return <div>
    {state.cells.map(
      entry => <Positioned key={keyOfCType(entry)} pos={entry.position}>
        <ShowByEntryCircuit entry={entry}/>
      </Positioned>) }
  </div>
}


