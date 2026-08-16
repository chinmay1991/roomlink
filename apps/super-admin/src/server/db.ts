// Schema + client now live in packages/db, shared with apps/hotel-admin —
// one database (`rmdb`) for the whole workspace. See packages/db/src/index.ts.
export { prisma } from '@roomlink/db'
