import * as React from 'react'
import {Subject, Observable} from 'rxjs'

export as namespace r2s;

export type reducer<t = any> = Observable<t>
export type storeReducer<t = any> = Observable<[string, {[key:string]:t}]>
export type actions = {[key:string]:Subject<any>}

export function createAction<t>():Subject<t>

export function createActions<t = actions>(actionNames:string[], sufix?:string):t

export function combineReducers<t = storeReducer[]>(observables:{[key:string]:reducer}):t

export function createStore<t = any>(reducers:storeReducer[], initialState?:t): Observable<t>

export type mapStateToProps = (state) => any

export function connect(selector:mapStateToProps, ...actionSubjectsArray:actions[]):(component: typeof React.Component | React.SFC) => typeof React.Component;

export interface ProviderContext<t = any> {
    state$: Observable<t>
}

export interface ProviderProps<t = any> {
  state$: Observable<t>,
  children: React.ReactNode[] | React.ReactNode | JSX.Element[] | JSX.Element
}

export class Provider<t = any> extends React.Component<ProviderProps<t>, Readonly<{}>, ProviderContext<t>> {
    static childContextTypes: {
        state$: Observable<any>
    }
    getChildContext(): ProviderContext
}
