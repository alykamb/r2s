
# r2s

Based on the work of [Michal Zalecki](https://github.com/MichalZalecki/connect-rxjs-to-react). I updated the code to support the React 16 and Rxjs 6 and made a few changes to make easier to create the store.

The name stands for **Reactive React Store**. This package provides an easy to implement and very powerful redux like state management using [**Rxjs**](https://rxjs-dev.firebaseapp.com/guide/overview) operators and pipes.

## Getting started
* Install packages:

```bash
npm install rxjs r2s
```

### Create the actions:

```javascript
//store/counter/actions.js
import { createActions } from 'r2s'

const counterActions = createActions(['increase', 'decrease', 'reset'])
export default counterActions
```

The **createActions** functions returns an object with new Subjects. So it's the same thing as:

```javascript
//store/counter/actions.js
import { Subject } from "rxjs";

const counterActions = {
	increase: new Subject(),
	decrease: new Subject(),
	reset: new Subject()
}

export default counterActions
```

### Create Reducers
```javascript
//store/counter/reducer.js
import { map } from 'rxjs/operators';

import counterActions from './actions';

import {createReducers} from '@/r2s'

const initialState = 0;

const reducers = [
	counterActions.increase.pipe(map(() => state => state + 1)),
	counterActions.decrease.pipe(map(() => state => state - 1)),
	counterActions.reset.pipe(map(() => () => initialState))
]

export default createReducers(initialState, reducers);

```
The **createReducers** function is an helper that creates an Behavior Subject and merges the functions from the reducers array. The Following code is equivalent to the above:
```javascript
//store/counter/reducer.js
import { BehaviorSubject } from 'rxjs';
import { map, merge, mergeScan, publishReplay, refCount } from 'rxjs/operators';

import counterActions from './actions';

const initialState = 0;

export default new BehaviorSubject(() => initialState)
.pipe(
  merge(
    counterActions.increase.pipe(map(() => state => state + 1)),
  	counterActions.decrease.pipe(map(() => state => state - 1)),
  	counterActions.reset.pipe(map(() => () => initialState))
  ),
  mergeScan((state, reducer) => {
    return of(reducer(state))
  }, initialState),
  publishReplay(1),
  refCount()
)
```
What we do is create a new observable from the initial state with [**of**](https://rxjs-dev.firebaseapp.com/api/index/function/of) and  [**merge**](https://rxjs-dev.firebaseapp.com/api/index/function/merge) all streams into a single Observable.
Each stream's content is [**map**](https://rxjs-dev.firebaseapp.com/api/operators/map)ped to a function that receives the current state so we can use it to return the new one. This function is where the Reducers pure functions act, always returning a new state.

If our Subject had a payload, it would be the first argument of the function, as an example:
```javascript
counterActions.setValue.pipe(map(payload => () => payload))
//or
counterActions.addValue.pipe(map(payload => state => state + payload))
```

### Combine Reducers and create the Store

```javascript
//store/store.js
import { combineReducers, createStore } from 'r2s';
import counterReducer$ from './counter/reducer';

const reducers = combineReducers({
  counter: counterReducer$
})

const store$ = createStore(reducers);
export default store$;
```
As of 3.0 combine reducers is no long necessary, you can just pass an object to the store:
```javascript
//store/store.js
import { createStore } from 'r2s';
import counterReducer$ from './counter/reducer';

const reducers = {
  counter: counterReducer$
}

const store$ = createStore(reducers);
export default store$;
```
Here we add all our reducers passing an object. The property name will be the same in the State.
Then we create and export our Store.

### Add Provider to our App

```javascript
//index.js
import { Provider } from "r2s";
import store from './store';

ReactDOM.render(
  <Provider state$={store}>
    <App />
  </Provider>,
  document.getElementById('root'));
```

### Create a component and connect to the store

```javascript
//Counter.js
import React from 'react';
import {connect} from 'r2s';
import counterActions from './store/counter/actions'

function Counter(props) {
  return (
    <div>
      <h1>{props.counter}</h1>
      <button onClick={props.increase}>Increase</button>
      <button onClick={props.decrease}>Decrease</button>
      <button onClick={props.reset}>Reset</button>
    </div>
  )
}

function mapStateToProps(state) {
  return {
    counter: state.counter
  }
}

export default connect(mapStateToProps, counterActions)(Counter)
```

The first argument of the connect function is a function which receives the state and returns an object, which will be passed to the component as Props.
The second argument is an actions object  (with Subjects as properties values) which will be passed as props functions. And the Third object is for passing anything else you want as props.

The connect can receive n actions objects as arguments, as follows:
```javascript
export default connect(
	({counter, user}) =>  ({counter, user}),
	{...userActions, ...counterActions},
	{otherProp: 'foo'}
)(Counter)
```

Please note the you are not required to use the actions on the connect, the following works too:
```javascript
//Counter.js
import React from 'react';
import {connect} from 'r2s';
import counterActions from './store/counter/actions'

function Counter({counter, increase, decrease, reset}) {
  return (
    <div>
      <h1>{this.props.counter}</h1>
      <button onClick={() => counterActions.increase.next()}>Increase</button>
      <button onClick={() => counterActions.decrease.next()}>Decrease</button>
      <button onClick={() => counterActions.reset.next()}>Reset</button>>
    </div>
  )
}

export default connect(({counter}) =>  ({counter}))(Counter)
```

## Async Actions

For the async actions, while the code can be added anywhere between the Subject and the last Reducer Map, i found it easier to maintain in a middle file, similar to actions itself. I called it effects for my experience with [**Ngrx**](https://github.com/ngrx/platform)

So an effects file would be:

```javascript
//store/counter/effects.js
import authActions from "./auth.actions";
import { from, of} from "rxjs";
import { switchMap, map, catchError} from 'rxjs/operators';

export default {
	login:authActions.login
	.pipe(
		switchMap(payload => {
			return from(axios.post('/api/login', payload))
				.pipe(
					map(response => ({user:response.user, status:'fetched'})),
					catchError(err => of({error:err, status:'error'}))
				)
	    })
	)
}
```

So, we take the action Subject, use the [**switchMap**](https://rxjs-dev.firebaseapp.com/api/operators/switchMap) operator to map it to new Observable. This new observable is created with [**from**](https://rxjs-dev.firebaseapp.com/api/index/function/from), which creates an Observable from an Observable-like object, such as the axios promise.  Then we map the response from the promise to our data, and catch it with [**catchError**](https://rxjs-dev.firebaseapp.com/api/operators/catchError) if it rejects.

One import thing to keep in mind is that observables complete once they have an error, so if the inner pipe operators were placed in the outer one, we would not be able to retry the login action, because our Subject would be complete and stop emitting new data down the stream.

This is the code for such case, and would not work after the first login fail:
```javascript
//store/counter/effects.js

// THIS WILL NOT WORK PROPERLY
export default {
  login: authActions.login
  .pipe(
    switchMap(payload => from(axios.post('/api/login', payload))),
    map(response => ({user:response.user, status:'fetched'})),
    catchError(err => of({error:err, status:'error'}))    
  )
 }
```
After that we use our effects observable in the reducer file:

```javascript
//store/counter/reducer.js
import authActions from "./actions";
import authEffects from "./effects";

const initialState = {user: {}, status:'started', error:null};

const AuthReducer$ = of(state => ({...initialState, ...state}))
  .pipe(
    merge(      
	  // first the action itself, so we let the app know we are fetching data and show a loader
      authActions.login.pipe(map(() => state => ({...state, status:'fetching', error:null}))),
      // and the result from our effects
      authEffects.login.pipe(map(payload => state => ({...state, ...payload})))
    )
)
```

## Actions Side Effects

The [**Tap**](https://rxjs-dev.firebaseapp.com/api/operators/tap)  operator makes easy to handle side effects within the application.

After a successfully login we can redirect the user to the dashboard. Creating a history object with [**history**](https://github.com/ReactTraining/history), we can use it along the tap operator in the login effect pipe:

create a history.js:
```javascript
//history.js
import createHistory from "history/createBrowserHistory"

export default createHistory();
```
auth/effects.js:
```javascript
//store/auth/effects.js
import authActions from "./auth.actions";
import { from, of} from "rxjs";
import { switchMap, tap, map, catchError} from 'rxjs/operators'; // <- add tap

import history from '../../history'

export default {
	login:authActions.login
	.pipe(
		switchMap(payload => {
			return from(axios.post('/api/login', payload))
				.pipe(
					map(response => ({user:response.user, status:'fetched'})),
					catchError(err => of({error:err, status:'error'}))
				)
	    }),
	    // NEW CODE
	    tap(payload => {
          if(!payload.error) {
            history.push('/dashboard')
          }
        })
	)
}
```

or dispatch an action:
```javascript
import anotherActions from '../another/actions'
...
tap(payload =>  {  if(!payload.error)  { anotherActions.doStuff.next(payload)  }  })
```

## A diagram of the entire flux

[diagram](https://mermaidjs.github.io/mermaid-live-editor/#/view/eyJjb2RlIjoiZ3JhcGggTFJcbkFbQWN0aW9uc10gLS0-IEJbRWZmZWN0c11cblNbU2lkZSBFZmZlY3RdIC0tIERpc3BhdGNoIC0tPiBBXG5CIC0tIFRhcCAtLT4gU1xuQiAtLSBQcm9taXNlIC0tPiBFKEV4dGVybmFsIEFwaSlcbkUgLS0gUmVzcG9uc2UgLS0-IEJcbkIgLS0-IENbUmVkdWNlcnNdXG5BIC0tPiBDXG5DIC0tPiBEe1N0b3JlfVxuRCAtLSBjb25uZWN0IC0tPiBGKChDb21wb25lbnRzKSlcbkYgLS0gZGlzcGF0Y2ggQWN0aW9ucyAtLT4gQVxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0)

Of course it is just an example, you can add any operator to the pipes and change the data as you need.
