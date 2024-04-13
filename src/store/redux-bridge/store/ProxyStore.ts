import assignIn from 'lodash.assignin';

import { DISPATCH_TYPE, FETCH_STATE_TYPE, STATE_TYPE, PATCH_STATE_TYPE } from '../constants';
import shallowDiff from '../strategies/shallowDiff/patch';
import { getBrowserAPI } from '../util';

const backgroundErrPrefix =
    '\nLooks like there is an error in the background page. ' +
    'You might want to inspect your background page for more details.\n';

const defaultOpts = {
    state: {},
    patchStrategy: shallowDiff,
};

declare global {
    interface SymbolConstructor {
        readonly observable: symbol;
    }
}

class ProxyStore {
    readyResolved;
    readyPromise;
    readyResolve;
    browserAPI;
    deserializer;
    serializedPortListener;
    serializedMessageSender;
    listeners;
    state;
    patchStrategy;
    [Symbol.observable];

    /**
     * Creates a new Proxy store
     * @param  {object} options An object of form {state,  serializer, deserializer, diffStrategy}, where `portName` is a required string and defines the name of the port for state transition changes, `state` is the initial state of this store (default `{}`) `extensionId` is the extension id as defined by browserAPI when extension is loaded (default `''`), `serializer` is a function to serialize outgoing message payloads (default is passthrough), `deserializer` is a function to deserialize incoming message payloads (default is passthrough), and patchStrategy is one of the included patching strategies (default is shallow diff) or a custom patching function.
     */
    constructor({ state = defaultOpts.state, patchStrategy = defaultOpts.patchStrategy } = defaultOpts) {
        if (typeof patchStrategy !== 'function') {
            throw new Error(
                'patchStrategy must be one of the included patching strategies or a custom patching function',
            );
        }

        this.readyResolved = false;
        this.readyPromise = new Promise((resolve) => (this.readyResolve = resolve));

        this.browserAPI = getBrowserAPI();
        this.initializeStore = this.initializeStore.bind(this);

        // We request the latest available state data to initialise our store
        this.browserAPI.runtime.sendMessage({ type: FETCH_STATE_TYPE }, undefined, this.initializeStore);

        this.serializedPortListener = (...args) => this.browserAPI.runtime.onMessage.addListener(...args);
        this.serializedMessageSender = (...args) => this.browserAPI.runtime.sendMessage(...args);
        this.listeners = [];
        this.state = state;
        this.patchStrategy = patchStrategy;

        // Don't use shouldDeserialize here, since no one else should be using this port
        this.serializedPortListener((message) => {
            switch (message.type) {
                case STATE_TYPE:
                    this.replaceState(message.payload);

                    if (!this.readyResolved) {
                        this.readyResolved = true;
                        this.readyResolve();
                    }
                    break;

                case PATCH_STATE_TYPE:
                    this.patchState(message.payload);
                    break;

                default:
                // do nothing
            }
        });

        this.dispatch = this.dispatch.bind(this); // add this context to dispatch
        this.getState = this.getState.bind(this); // add this context to getState
        this.subscribe = this.subscribe.bind(this); // add this context to subscribe
    }

    /**
     * Returns a promise that resolves when the store is ready. Optionally a callback may be passed in instead.
     * @param [function] callback An optional callback that may be passed in and will fire when the store is ready.
     * @return {object} promise A promise that resolves when the store has established a connection with the background page.
     */
    ready(cb = null) {
        if (cb !== null) {
            return this.readyPromise.then(cb);
        }

        return this.readyPromise;
    }

    /**
     * Subscribes a listener function for all state changes
     * @param  {function} listener A listener function to be called when store state changes
     * @return {function}          An unsubscribe function which can be called to remove the listener from state updates
     */
    subscribe(listener) {
        this.listeners.push(listener);

        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    /**
     * Replaces the state for only the keys in the updated state. Notifies all listeners of state change.
     * @param {object} state the new (partial) redux state
     */
    patchState(difference) {
        this.state = this.patchStrategy(this.state, difference);
        this.listeners.forEach((l) => l());
    }

    /**
     * Replace the current state with a new state. Notifies all listeners of state change.
     * @param  {object} state The new state for the store
     */
    replaceState(state) {
        this.state = state;

        this.listeners.forEach((l) => l());
    }

    /**
     * Get the current state of the store
     * @return {object} the current store state
     */
    getState() {
        return this.state;
    }

    /**
     * Stub function to stay consistent with Redux Store API. No-op.
     */
    replaceReducer() {
        return;
    }

    /**
     * Dispatch an action to the background using messaging passing
     * @param  {object} data The action data to dispatch
     * @return {Promise}     Promise that will resolve/reject based on the action response from the background
     */
    dispatch(data) {
        return new Promise((resolve, reject) => {
            this.serializedMessageSender(
                {
                    type: DISPATCH_TYPE,
                    payload: data,
                },
                null,
                (resp) => {
                    if (!resp) {
                        const error = this.browserAPI.runtime.lastError;
                        const bgErr = new Error(`${backgroundErrPrefix}${error}`);

                        reject(assignIn(bgErr, error));
                        return;
                    }

                    const { error, value } = resp;

                    if (error) {
                        const bgErr = new Error(`${backgroundErrPrefix}${error}`);

                        reject(assignIn(bgErr, error));
                    } else {
                        resolve(value && value.payload);
                    }
                },
            );
        });
    }

    initializeStore(message) {
        if (message && message.type === FETCH_STATE_TYPE) {
            this.replaceState(message.payload);

            // Resolve if readyPromise has not been resolved.
            if (!this.readyResolved) {
                this.readyResolved = true;
                this.readyResolve();
            }
        }
    }
}

export default ProxyStore;
