// XP per cleanup action. Mirrors POINTS_PER_ACTION in
// express-backend/src/routes/points.ts (the server decides the real award);
// keep the two in sync. Skipping an email gives no XP.
export const POINTS_PER_ACTION = { ARCHIVE: 2, LABEL: 1, DELETE: 1 } as const;

export type PointsAction = keyof typeof POINTS_PER_ACTION;
