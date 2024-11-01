/**
 * User managment routes
 *
 * @since 1.0.0
 * @version 1.0.0
 */
import { Router } from "express";
import TokenController from "../controllers/token";
import { checkJwt } from "../middlewares/checkJwt";
import { checkRole } from "../middlewares/checkRole";

const router = Router();
const token = new TokenController();

router.get("/test", token.test);
router.post("/send", token.send);
router.post("/webhook", token.handleFiatTx);

export default router;
