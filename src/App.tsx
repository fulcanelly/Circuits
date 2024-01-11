import './App.css';
import { useEffect, useReducer } from 'react';
import { defaultReducer, handleMouseWheel, initState, sendCellsUpdate } from './reducer';
import { Field, Grid, MovableField, Toolbar } from './gui';
import { CircuitComposer } from './circuit';
import ReactJson from 'react-json-view'


//===========================
// App
//===========================


function App() {



  const [state, dispatch] = useReducer(defaultReducer, initState())


  useEffect(() => {
    document.addEventListener('keydown', function(event) {
      if (event.key === 'r') {
        dispatch({type:'scale_change', deltaY: 1})
      }
    });

    const interval = setInterval(() => sendCellsUpdate(dispatch), 2100)

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
