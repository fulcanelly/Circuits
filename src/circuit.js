import React, { useEffect, useReducer, useRef, useState } from 'react';
import { settings } from './settings';
import * as R from 'ramda'
import { resizeCanvas } from './gui';

//===========================
// Circuit components
//===========================

//==============================
// Common canvas tile utils 
//==============================

function fillCellBackground(ctx) {
  ctx.fillStyle = settings.colors.background
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


function setupDrawersTest(ref) {
  let current = 0
  let drawers = [
    draw90DegBendWire,
    drawThreeWayWire,
    drawCrossWire,
    drawStraightWire
  ]

  let redraw = () => {
    adjustTileCanvasSize(ref)
    current++ 
    drawers[current % 4](getCanvasCtx(ref), settings.colors.idleWire)
  }

  let interval = setInterval(redraw, 1000)

  return () => clearInterval(interval) 
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


//example return <AWireCircuit state={{powered: false, rotation: 1, wireType: 2}}></AWireCircuit>

export function AWireCircuit({ state: { powered, wireType, rotation} }) {
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
  ]

  const color = powered ? 
    settings.colors.poweredWire : 
    settings.colors.idleWire

  useEffect(() => {
    adjustTileCanvasSize(canvasRef)
    wireTypes[wireType ?? 0 % 4](getCanvasCtx(canvasRef), color)
  },[])

  return <canvas 
    ref={canvasRef}
    style={style}>
  </canvas>
}


//TODO remove
export function WireCircuit({ rotation, powered, wireType }) {
  const canvasRef = useRef(null)

  const style = {
    width: `${settings.cellSize + 1}px`,
    height: `${settings.cellSize + 1}px`,
  //  transform: "rotate(90deg)"
  }

  let drawWire = () => {
    adjustTileCanvasSize(canvasRef)
    draw90DegBendWire(
      getCanvasCtx(canvasRef))
  }

  useEffect(() => setupDrawersTest(canvasRef), [])

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
  const style = {
    position: 'absolute',
    top: `${pos.y * settings.cellSize}px`,
    left: `${pos.x * settings.cellSize}px`
  }  
  return <div style={style} >{children}</div>
}


// just temporary circuit NOP component
export function PlaceholderCircuit() {
  const style = {
    width: '50px',
    height: '50px',
    backgroundColor: 'blue',
    position: 'absolute'
  }

  return <div style={style}></div>
}

// helper to identify circuit components by it's entry
export function keyOfCType(entry) {
  return `${entry.x}_${entry.y}`
}

// component responsible for dispatching circuit type and placing in right point
export function CircuitComposer({state}) {
  return <div>
    {state.cells.map(
      it => <Positioned key={keyOfCType(it)} pos={it}>
        <WireCircuit/>
      </Positioned>) }
  </div>
}


