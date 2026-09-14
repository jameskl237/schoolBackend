import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      email: string;
      establishmentId: number;
      permissions: string[];
      teacherId?: number;
      studentId?: number;
      parentId?: number;
      guardianId?: number;
    };
  }
}
