import * as React from 'react'

import {BehaviorSubject, Observable,  Subject} from 'rxjs'

export as namespace r2s;

export type reducer<t = any> = Observable<t>
export type storeReducer<t = any> = Observable<[string, {[key:string]:t}]>
export interface Actions {[key:string]:Subject<any>}


export const mapToState

export function createAction<t>():Subject<t>

export function createActions<t>(actionNames:string[], sufix?:string):t

export function createReducers<t = any>(initialState:t, reducers?:Array<Observable<(a?:t) => any>>):BehaviorSubject<t>

export function combineReducers<t>(observables:{[key:string]:reducer}):t

export function createStore<t = any>(reducers:{[key:string]:Observable<any>}): Observable<t>

export type mapStateToProps = (state) => any

export function connect<t=any>(selector:mapStateToProps, actionSubjects?:Actions, otherProps?:{[key:string]:any}):(component: React.ComponentType<any>) => React.ComponentType<t>;
export function subscribe<t=any>(observables:{[key:string]:Observable<any>}, actionSubjects?:Actions, otherProps?):(component: React.ComponentType<any>) => React.ComponentType<t>;

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
