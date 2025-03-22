// src/tests/auth.test.ts
import request from "supertest";
import app from "../server";

describe("Auth Endpoints", () => {
  let token: string;
  let userId: string;
  // שימוש באימייל ייחודי כדי למנוע התנגשויות בכל ריצה
  const uniqueEmail = `testuser_${Date.now()}@example.com`;

  describe("Registration", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: uniqueEmail,
          password: "password123",
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("token");
      userId = res.body._id;
    });

    it("should not register a user with an already used email", async () => {
      // ניסיון לרישום עם אותו אימייל, צפוי לקבל שגיאה (400 או 500 בהתאם למימוש)
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser2",
          email: uniqueEmail, // אותו אימייל כמו הקודם
          password: "password456",
        });
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it("should fail registration with missing password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser_missing_password",
          email: `testmissing_${Date.now()}@example.com`
          // password חסר
        });
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Login", () => {
    it("should login the user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: uniqueEmail, password: "password123" });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      token = res.body.token;
    });

    it("should not login with incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: uniqueEmail, password: "wrongpassword" });
      expect(res.statusCode).toEqual(401);
    });

    it("should not login with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@example.com", password: "password123" });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe("Profile", () => {
    it("should get the user profile successfully when token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("_id", userId);
    });

    it("should fail to get profile without token", async () => {
      const res = await request(app).get("/api/auth/profile");
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to get profile with invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer invalidtoken`);
      expect(res.statusCode).toEqual(401);
    });
  });
});
