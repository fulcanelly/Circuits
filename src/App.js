import logo from './logo.svg';
import './App.css';
import { useEffect, useReducer, useRef, useState } from 'react';
import { height, margin } from '@mui/system';
import * as R from 'ramda'
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
