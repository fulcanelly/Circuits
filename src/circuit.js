import { useEffect, useReducer, useRef, useState } from 'react';
import { settings } from './settings';

//===========================
// Circuit components
//===========================

export function WireCircuit({ rotation, powered, wireType }) {
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
  return <div style={style}>{children}</div>
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
        <PlaceholderCircuit/>
      </Positioned>) }
  </div>
}


