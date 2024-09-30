/**
 * User managment routes
 *
 * @since 1.0.0
 * @version 1.0.0
 */
import { Router } from "express";
import UserController from "../controllers/user";
import { checkJwt } from "../middlewares/checkJwt";
import { checkRole } from "../middlewares/checkRole";

const router = Router();
const user = new UserController();

router.post("/login", user.login);
router.get("/test", user.test);
// router.get("/:walletAddress", user.userByWalletAddress);
router.get("/", user.list);
router.get("/fetchLottery", user.fetchLottery);
router.get("/fetchOldLottery", user.fetchOldLottery);
router.post("/updateWinner", user.updateWinner);
router.post("/recordPayId", user.recordPayId);
router.get("/fetchForGenerateRandom", user.fetchForGenerateRandom);
router.post("/fetchForGenerateWinner", user.fetchForGenerateWinner);
router.get("/fetchForSendReward", user.fetchForSendReward);
router.post("/fetchAvailableLottery", user.fetchAvailableLottery);
router.post("/wrongCmId", user.wrongCmId);
router.post("/generateRandom", user.generateRandom);
router.post("/createLottery", user.createLottery);
router.get("/reset", user.reset);

export default router;
