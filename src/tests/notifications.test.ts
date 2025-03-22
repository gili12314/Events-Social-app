import request from "supertest";
import app from "../server";

describe("Notifications Endpoints", () => {
  let token: string;
  const uniqueEmail = `notificationtest_${Date.now()}@example.com`;

  beforeAll(async () => {
    // רישום והתחברות למשתמש עבור בדיקות התראות
    const resRegister = await request(app)
      .post("/api/auth/register")
      .send({
        username: "notificationTester",
        email: uniqueEmail,
        password: "password123",
      });
    expect(resRegister.statusCode).toEqual(201);

    const resLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: uniqueEmail,
        password: "password123",
      });
    expect(resLogin.statusCode).toEqual(200);
    token = resLogin.body.token;
  });

  describe("Success scenarios", () => {
    it("should get notifications for the user (empty array if none exist)", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      // אם אין התראות, אמור להחזיר מערך ריק
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it("should mark notifications as read successfully (even if none exist)", async () => {
      const res = await request(app)
        .put("/api/notifications/read")
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Notifications marked as read");
    });
  });

  describe("Failure and edge cases", () => {
    it("should fail to get notifications without an authorization header", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to get notifications with an invalid token", async () => {
      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", "Bearer invalidtoken");
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to mark notifications as read without a token", async () => {
      const res = await request(app).put("/api/notifications/read");
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to mark notifications as read with an invalid token", async () => {
      const res = await request(app)
        .put("/api/notifications/read")
        .set("Authorization", "Bearer invalidtoken");
      expect(res.statusCode).toEqual(401);
    });
  });
});
