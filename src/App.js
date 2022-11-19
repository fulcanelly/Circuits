import './App.css';
import { useReducer } from 'react';
import { defaultReducer, initState } from './reducer';
import { Field, Grid, MovableField, Toolbar } from './gui';
import { CircuitComposer } from './circuit';



//===========================
// App
//===========================


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
