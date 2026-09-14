import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { errorHandler } from "./common/errors/error-handler.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { academicYearRouter } from "./modules/academic-years/index.js";
import { attendanceRouter } from "./modules/attendances/index.js";
import { authRouter } from "./modules/auth/index.js";
import { classSubjectRouter } from "./modules/class-subjects/index.js";
import { classRouter } from "./modules/classes/index.js";
import { classroomRouter } from "./modules/classrooms/index.js";
import { cycleRouter } from "./modules/cycles/index.js";
import { dashboardRouter } from "./modules/dashboard/index.js";
import { disciplineRouter } from "./modules/disciplines/index.js";
import { enrollmentRouter } from "./modules/enrollments/index.js";
import { establishmentRouter } from "./modules/establishments/index.js";
import { evaluationReviewRouter } from "./modules/evaluation-reviews/index.js";
import { evaluationRouter } from "./modules/evaluations/index.js";
import { feeStructureRouter } from "./modules/fee-structures/index.js";
import { feeTypeRouter } from "./modules/fee-types/index.js";
import { gradeLevelRouter } from "./modules/grade-levels/index.js";
import { gradeRouter } from "./modules/grades/index.js";
import { guardianRouter } from "./modules/guardians/index.js";
import { healthRouter } from "./modules/health/index.js";
import { invoiceRouter } from "./modules/invoices/index.js";
import { notificationRouter } from "./modules/notifications/index.js";
import { parentRouter } from "./modules/parents/index.js";
import { paymentRouter } from "./modules/payments/index.js";
import { periodRouter } from "./modules/periods/index.js";
import { roleRouter } from "./modules/roles/index.js";
import { reportCardRouter } from "./modules/report-cards/index.js";
import { schoolLevelRouter } from "./modules/school-levels/index.js";
import { sectionRouter } from "./modules/sections/index.js";
import { sequenceRouter } from "./modules/sequences/index.js";
import { studentRouter } from "./modules/students/index.js";
import { subjectRouter } from "./modules/subjects/index.js";
import { teacherRouter } from "./modules/teachers/index.js";
import { teachingRouter } from "./modules/teaching/index.js";
import { timetableRouter } from "./modules/timetables/index.js";
import { transportRouter } from "./modules/transport/index.js";
import { userRouter } from "./modules/users/index.js";

const app = express();

app.use(
  pinoHttp({
    logger,
  }),
);

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(compression());

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(healthRouter);

app.use(authRouter);

app.use(userRouter);

app.use(roleRouter);

app.use(academicYearRouter);

app.use(periodRouter);

app.use(sequenceRouter);

app.use(schoolLevelRouter);

app.use(sectionRouter);

app.use(cycleRouter);

app.use(gradeLevelRouter);

app.use(classRouter);

app.use(classroomRouter);

app.use(subjectRouter);

app.use(teacherRouter);

app.use(classSubjectRouter);

app.use(teachingRouter);

app.use(studentRouter);

app.use(enrollmentRouter);

app.use(evaluationRouter);

app.use(evaluationReviewRouter);

app.use(gradeRouter);

app.use(attendanceRouter);

app.use(timetableRouter);

app.use(parentRouter);

app.use(guardianRouter);

app.use(feeTypeRouter);

app.use(feeStructureRouter);

app.use(invoiceRouter);

app.use(paymentRouter);

app.use(disciplineRouter);

app.use(reportCardRouter);

app.use(transportRouter);

app.use(establishmentRouter);

app.use(dashboardRouter);

app.use(notificationRouter);

app.use(notFoundMiddleware);

app.use(errorHandler);

export default app;
