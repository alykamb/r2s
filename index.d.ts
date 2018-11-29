import * as React from 'react'

import {BehaviorSubject, Observable,  Subject} from 'rxjs'

export as namespace r2s;

export type reducer<t = any> = Observable<t>
export type storeReducer<t = any> = Observable<[string, {[key:string]:t}]>
export interface Actions {[key:string]:Subject<any>}


export const mapToState

export function createActions<t>(actionNames:string[], sufix?:string):t

export function createReducers<t = any>(initialState:t, reducers?:Observable<(a?:any) => t>):BehaviorSubject<t>

export type mapStateToProps = (state) => any

export function subscribe<t=any>(observables:{[key:string]:Observable<any>}, actionSubjects?:Actions, otherProps?):(component: React.ComponentType<any>) => React.ComponentType<t>;
