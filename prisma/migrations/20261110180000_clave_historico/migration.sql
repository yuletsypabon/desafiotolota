CREATE TABLE "ClaveHistorico" (
    "id" TEXT NOT NULL DEFAULT 'historico',
    "hash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClaveHistorico_pkey" PRIMARY KEY ("id")
);
