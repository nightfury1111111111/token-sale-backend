/**
 * Route mananger
 *
 * @since 1.0.0
 * @version 1.0.0
 */

import { Router } from "express";
import nft from "./user";

const routes = Router();

routes.use("/nfts", nft);

export default routes;
