-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Новый',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "dob" DATE,
    "gender" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "email" TEXT,
    "mobile_number" TEXT,
    "instagram" TEXT,
    "whatsapp" TEXT,
    "zoom" TEXT,
    "tg_username" TEXT,
    "tg_user_id" TEXT,
    "tg_bio" TEXT,
    "tg_last_visit_status" TEXT,
    "tg_premium_account" BOOLEAN NOT NULL DEFAULT false,
    "tg_gifts" TEXT,
    "tg_account_tech_status" TEXT,
    "bio" TEXT,
    "add_info" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
