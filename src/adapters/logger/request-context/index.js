import { AsyncLocalStorage } from "node:async_hooks";

const requestContextStorage = new AsyncLocalStorage();

/**
 * @template TReturn
 * @param {object} params
 * @param {Record<string, unknown>} params.context
 * @param {() => TReturn} params.callback
 * @returns {TReturn}
 */
const runWithLogContext = ({ context, callback }) => {
  return requestContextStorage.run(context, callback);
};

/**
 * @returns {Record<string, unknown>}
 */
const getLogContext = () => {
  return requestContextStorage.getStore() ?? {};
};

export { runWithLogContext, getLogContext };
