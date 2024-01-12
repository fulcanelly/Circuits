import { Cell, State } from "./model";

export function saveCurrentCells(cells: Cell[]) {
  localStorage.setItem('current-cells', JSON.stringify(cells))
}

export function loadCurrent(): Cell[] | undefined {
  const it = localStorage.getItem('current-cells')
  if (it) {
    return JSON.parse(it)
  }
}
