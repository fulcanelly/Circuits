import './App.css';
import { useEffect, useReducer } from 'react';
import { defaultReducer, initState, sendCellsUpdate } from './reducer';
import { Field, Grid, MovableField, Toolbar } from './gui';
import { CircuitComposer } from './circuit';
import ReactJson from 'react-json-view'
import { findDatasheet, visualToPins } from './engine';


//===========================
// App
//===========================


function App() {

  const [state, dispatch] = useReducer(defaultReducer, initState())

  useEffect(() => {    
    const interval = setInterval(() => sendCellsUpdate(dispatch), 200)

   return () => clearInterval(interval)
  }, [])

  return <>
      <ReactJson collapsed={true} src={state}/>
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
