const React = require('react')

const {BehaviorSubject, from, Observable, of, pipe, Subject } = require('rxjs');
const { combineAll, map, merge, mergeAll, mergeScan, takeUntil, switchMap, tap } = require('rxjs/operators');


module.exports.createActions = function createActions(actionNames, sufix = '') {
  const actions = {}
  actionNames.forEach(name => {
    actions[name+sufix] = new Subject()
  })
  return actions
}

module.exports.createReducers = function createReducers(initialState = null, reducers) {
  const i = initialState
  const observable = of(() => i)
  .pipe(
    merge(
      reducers
    ),
    mergeScan((state, reducer) => {
      return of(reducer(state))
    }, i),
  )

  const subject = new BehaviorSubject(i)
  observable.subscribe(a => {
    subject.next(a)
  })

  return subject
}

module.exports.mapToState = pipe(
  switchMap((o) => {
    const keys = Object.keys(o)
    return of(keys.map((k) => o[k])).pipe(
      mergeAll(),
      combineAll(function () {
        const r = {}
        Array.from(arguments).forEach((a,i) => {
          r[keys[i]] = arguments[a]
        })
        return r
      })
    )
  })
)


module.exports.subscribe = function subscribe(observables, actionSubjects = {}, otherProps = {}) {
  let actions = {}

  Object.keys(actionSubjects).forEach((key) => {
    actions[key] = value => actionSubjects[key].next(value)
  })

  return function wrapWithConnect(WrappedComponent) {
    return class Connect extends React.Component {
      constructor(props) {
        super(props)

        this.state = {}
        this.unsubscribe = new Subject();
      }

       componentWillMount() {
         Object.keys(observables).forEach(key => {           
           observables[key]
           .pipe(takeUntil(this.unsubscribe))
           .subscribe(value => {
             this.setState({[key]:value})
           })
         })
      }

      componentWillUnmount() {
        this.unsubscribe.next(true)
      }

       render() {
         const props = {}
         Object.keys(this.state).forEach(k => props[k] = this.state[k])
         Object.keys(this.props).forEach(k => props[k] = this.props[k])
         Object.keys(otherProps).forEach(k => props[k] = otherProps[k])
         Object.keys(actions).forEach(k => props[k] = actions[k])
          return (
            React.createElement(WrappedComponent, props)
          );
      }
    };
  };
}
