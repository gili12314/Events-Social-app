import request from "supertest";
import app from "../server";

describe("User Endpoints", () => {
  let token: string;
  let userId: string;
  const uniqueEmail = `userTest_${Date.now()}@example.com`;

  beforeAll(async () => {
    const resRegister = await request(app)
      .post("/api/auth/register")
      .send({
        username: "userTester",
        email: uniqueEmail,
        password: "password123",
      });
    expect(resRegister.statusCode).toEqual(201);
    userId = resRegister.body._id;

    const resLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: uniqueEmail,
        password: "password123",
      });
    expect(resLogin.statusCode).toEqual(200);
    expect(resLogin.body).toHaveProperty("token");
    token = resLogin.body.token;
  });

  describe("Success scenarios", () => {
    it("should update the user profile", async () => {
      const res = await request(app)
        .put("/api/users/update")
        .set("Authorization", `Bearer ${token}`)
        .send({
          username: "updatedUser",
          email: uniqueEmail,
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Profile updated successfully");
      expect(res.body.user.username).toEqual("updatedUser");
    });

    it("should upload a profile picture", async () => {
      const res = await request(app)
        .put("/api/users/profile-picture")
        .set("Authorization", `Bearer ${token}`)
        .attach("image", "src/tests/test-files/test.jpg");
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Profile picture updated");
      expect(res.body).toHaveProperty("profileImage");
    });
  });

  describe("Failure and edge cases", () => {
    it("should fail to update the profile without an Authorization header", async () => {
      const res = await request(app)
        .put("/api/users/update")
        .send({
          username: "shouldNotUpdate",
          email: uniqueEmail,
        });
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to update the profile with an invalid token", async () => {
      const res = await request(app)
        .put("/api/users/update")
        .set("Authorization", "Bearer invalidtoken")
        .send({
          username: "shouldNotUpdate",
          email: uniqueEmail,
        });
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to upload a profile picture if no file is attached", async () => {
      const res = await request(app)
        .put("/api/users/profile-picture")
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
