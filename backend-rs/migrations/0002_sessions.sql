CREATE TABLE IF NOT EXISTS "UserSessions" (
  "SessionId" uuid NOT NULL,
  "UserId" uuid NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "LastSeenAt" timestamp with time zone NOT NULL,
  "ExpiresAt" timestamp with time zone NOT NULL,
  "RevokedAt" timestamp with time zone NULL,
  CONSTRAINT "PK_UserSessions" PRIMARY KEY ("SessionId"),
  CONSTRAINT "FK_UserSessions_ApplicationUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "ApplicationUsers" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_UserSessions_UserId" ON "UserSessions" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_UserSessions_ExpiresAt" ON "UserSessions" ("ExpiresAt");

