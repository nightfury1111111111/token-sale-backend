/**
 * Route mananger
 *
 * @since 1.0.0
 * @version 1.0.0
 */

import { Router } from "express";
import token from "./token";

const routes = Router();

routes.use("/token", token);

export default routes;
