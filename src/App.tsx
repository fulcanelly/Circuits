import './App.css';
import { useEffect, useReducer } from 'react';
import { defaultReducer, handleMouseWheel, initState, sendCellsUpdate } from './reducer';
import { Field, Grid, MovableField, Toolbar } from './gui';
import { CircuitComposer } from './circuit';
import ReactJson from 'react-json-view'
import * as R from 'ramda'
import { buildLens } from './utils';
import { State } from './model';
import { loadCurrent } from './storage';


//===========================
// App
//===========================


function adjustedInitState(): State {
  const current = loadCurrent()

  if (current) {
    return R.set(buildLens<State>().cells._(), current!, initState())
  } else {
    return initState()
  }
}

function App() {



  const [state, dispatch] = useReducer(defaultReducer, adjustedInitState())


  useEffect(() => {
    document.addEventListener('keydown', function (event) {
      if (event.key === 'r') {
        dispatch({ type: 'scale_change', deltaY: 0 })
      }
    });

    const interval = setInterval(() => sendCellsUpdate(dispatch), 100)

    return () => clearInterval(interval)
  }, [])

  return <>
    <ReactJson collapsed={true} src={state} />
    <Toolbar dispatch={dispatch} state={state}></Toolbar>
    <Field dispatch={dispatch}>
      <MovableField state={state}>
        <Grid dispatch={dispatch}>
          <CircuitComposer state={state}></CircuitComposer>
        </Grid>
      </MovableField>
    </Field>
  </>
}

export default App;
