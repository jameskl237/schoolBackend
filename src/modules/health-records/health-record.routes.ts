import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";

import { HealthRecordController } from "./health-record.controller.js";

const router = Router();
const controller = new HealthRecordController();
const canManageRecords = authorize("medical-records.manage");
const canManageVaccinations = authorize("vaccinations.manage", "medical-records.manage");
const canManageInfirmary = authorize("infirmary.manage");

router.get("/medical-records", authenticate, canManageRecords, controller.listRecords.bind(controller));
router.get(
  "/medical-records/:studentId",
  authenticate,
  canManageRecords,
  controller.getRecord.bind(controller),
);
router.put(
  "/medical-records/:studentId",
  authenticate,
  canManageRecords,
  controller.saveRecord.bind(controller),
);

router.post("/vaccinations", authenticate, canManageVaccinations, controller.addVaccination.bind(controller));
router.patch(
  "/vaccinations/:id",
  authenticate,
  canManageVaccinations,
  controller.updateVaccination.bind(controller),
);
router.delete(
  "/vaccinations/:id",
  authenticate,
  canManageVaccinations,
  controller.removeVaccination.bind(controller),
);

router.get("/infirmary-visits", authenticate, canManageInfirmary, controller.listVisits.bind(controller));
router.post("/infirmary-visits", authenticate, canManageInfirmary, controller.createVisit.bind(controller));
router.patch(
  "/infirmary-visits/:id",
  authenticate,
  canManageInfirmary,
  controller.updateVisit.bind(controller),
);
router.delete(
  "/infirmary-visits/:id",
  authenticate,
  canManageInfirmary,
  controller.removeVisit.bind(controller),
);

export default router;
