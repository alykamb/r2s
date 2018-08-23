import React, { Component } from "react";
import PropTypes from "prop-types";
import {Subject, of, Observable } from "rxjs";
import { scan, merge, publishReplay, refCount, map} from 'rxjs/operators';

export function createAction() {
  return new Subject();
}

export function createActions(actionNames, sufix = '') {
  return actionNames.reduce((akk, name) => ({ ...akk, [name+sufix]: createAction() }), {});
}

export function combineReducers(observables) {
  return Object.keys(observables).map(scope => observables[scope].pipe(map(reducer => [scope, {[scope]:reducer}])))
}

export function createStore (reducers, initialState = {}) {
  const initialState$ = of(initialState)
  return new Observable().pipe(
    merge(initialState$, ...reducers),
    scan((state, [scope, reducer]) =>{
      return { ...state, [scope]: reducer[scope](state[scope]) }
    }),
    publishReplay(1),
    refCount()
  )
}

export function connect(selector = state => state, ...actionSubjectsArray) {
  let actions = {}
  actionSubjectsArray.forEach((actionSubjects) => {
    const a = Object.keys(actionSubjects)
    .reduce((akk, key) => ({ ...akk, [key]: value => actionSubjects[key].next(value) }), {})
    actions = {...actions, ...a}
  })

  return function wrapWithConnect(WrappedComponent) {
    return class Connect extends Component {
      static contextTypes = {
        state$: PropTypes.object.isRequired
      };

      componentWillMount() {
        this.subscription = this.context.state$.pipe(map(selector)).subscribe(state => {this.setState(state)});
      }

      componentWillUnmount() {
        this.subscription.unsubscribe();
      }

      render() {
        return (
          <WrappedComponent {...this.state} {...this.props} {...actions} />
        );
      }
    };
  };
}

export class Provider extends Component {
  static propTypes = {
    state$: PropTypes.object.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ]).isRequired
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
