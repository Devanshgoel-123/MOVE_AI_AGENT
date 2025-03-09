-- CreateTable
CREATE TABLE "UserPortfolioPreference" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "StablePercentage" INTEGER NOT NULL,
    "NativePercentage" INTEGER NOT NULL,
    "OtherPercentage" INTEGER NOT NULL,

    CONSTRAINT "UserPortfolioPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPortfolioPreference_walletAddress_key" ON "UserPortfolioPreference"("walletAddress");
