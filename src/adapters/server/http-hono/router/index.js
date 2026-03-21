/**
 * @import { Application } from '../../../../application/interface.js'
 */

import { Hono } from "hono";

/**
 * @param { object } params
 * @param { Application } params.application
 */
const createRouters = ({ application }) => {
  const helloRouter = new Hono();

  helloRouter.get("/:name", (c) => {
    const { name } = c.req.param();
    const result = application.hello({ name });

    return c.json({ message: result });
  });

  return {
    helloRouter,
  };
};

export { createRouters };
