-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "token_id" INTEGER NOT NULL,
    "token_address" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "decimals" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_id_key" ON "Token"("token_id");
