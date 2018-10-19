import React, { Component } from "react";
import PropTypes from "prop-types";
import {BehaviorSubject, Observable, of, pipe, Subject } from "rxjs";
import { combineAll, map, merge, mergeAll, mergeScan, takeUntil, switchMap } from 'rxjs/operators';

export function createAction() {
  return new Subject();
}

export function createActions(actionNames, sufix = '') {
  return actionNames.reduce((akk, name) => ({ ...akk, [name+sufix]: createAction() }), {});
}

export function combineReducers(observables) {
  return observables
}

export function createReducers(initialState = null, reducers = []) {
  const observable = of(() => initialState)
  .pipe(
    merge(
      ...reducers
    ),
    mergeScan((state, reducer) => {
      return of(reducer(state))
    }, initialState),
  )

  const subject = new BehaviorSubject(initialState)
  observable.subscribe(a => subject.next(a))

  return subject
}

export const mapToState = pipe(
  switchMap((o) => {
    const keys = Object.keys(o)
    return of(keys.map((k) => o[k])).pipe(
      mergeAll(),
      combineAll((...obs) => {
        return obs.reduce((acc, ob, i) => ({...acc, [keys[i]]:ob}), {})
      }),
    )
  })
)

export function createStore(reducers) {
  return of(reducers)
}

export function connect(selector = state => state, actionSubjects = {}, otherProps = {}) {
  let actions = {}

  const a = Object.keys(actionSubjects)
  .reduce((akk, key) => ({ ...akk, [key]: value => actionSubjects[key].next(value) }), {})
  actions = {...actions, ...a}


  return function wrapWithConnect(WrappedComponent) {
    return class Connect extends Component {
       static contextTypes = {
        state$: PropTypes.object.isRequired
      };

       subscription

       componentWillMount() {
        this.subscription = this.context.state$
        .pipe(
          map(selector),
          mapToState,
         )
       .subscribe(state => {this.setState(state)});
      }

       componentWillUnmount() {
        this.subscription.unsubscribe();
      }

       render() {
        return (
          <WrappedComponent {...this.state} {...this.props} {...otherProps} {...actions} />
        );
      }
    };
  };
}

export function subscribe(observables, actionSubjects = {}, otherProps = {}) {
  let actions = {}

  const a = Object.keys(actionSubjects)
  .reduce((akk:any, key) => ({ ...akk, [key]: value => actionSubjects[key].next(value) }), {})
  actions = {...actions, ...a}


  return function wrapWithConnect(WrappedComponent) {
    return class Connect extends React.Component {
        unsubscribe = new Subject()

       componentWillMount() {
         Object.keys(observables).forEach(key => {
           observables[key].pipe(takeUntil(this.unsubscribe)).subscribe(value => {this.setState({[key]:value})})
         })
      }

      componentWillUnmount() {
        this.unsubscribe.next(true)
      }

       render() {
        return (
          <WrappedComponent {...this.state} {...this.props} {...otherProps} {...actions} />
        );
      }
    };
  };
}

export class Provider extends Component {
   static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]).isRequired,
    state$: PropTypes.object.isRequired,
  };

   static childContextTypes = {
    state$: PropTypes.object.isRequired
  };
   getChildContext() {
    return { state$: this.props.state$ };
  }

   render() {
    return this.props.children;
  }
}
