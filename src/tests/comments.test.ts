import request from "supertest";
import app from "../server";
import mongoose from "mongoose";

describe("Comments Endpoints", () => {
  let token: string;
  let eventId: string;
  let commentId: string;
  const uniqueEmail = `commenttest_${Date.now()}@example.com`;

  beforeAll(async () => {
    // רישום והתחברות למשתמש
    const resRegister = await request(app)
      .post("/api/auth/register")
      .send({
        username: "commentTester",
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

    // יצירת event לבדיקות – שימוש בנתיב createEvent
    const resEvent = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Event for Comments",
        description: "Testing comments on this event",
        date: "2023-12-31T20:00:00.000Z",
        location: "Comment Location",
      });
    expect(resEvent.statusCode).toEqual(201);
    eventId = resEvent.body._id;
  });

  afterAll(async () => {
    await request(app)
      .delete(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${token}`);
    // סגירת חיבור למסד במידת הצורך
    await mongoose.connection.close();
  });

  describe("Success scenarios", () => {
    it("should create a new comment", async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "This is a test comment." });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("_id");
      commentId = res.body._id;
    });

    it("should get comments for the event", async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/comments`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should update the comment", async () => {
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Updated comment text." });
      expect(res.statusCode).toEqual(200);
      expect(res.body.text).toEqual("Updated comment text.");
    });

    it("should delete the comment", async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Comment deleted successfully");
    });
  });

  describe("Failure and edge cases", () => {
    it("should fail to create a comment without authorization header", async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .send({ text: "Unauthorized comment" });
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to create a comment for a non-existent event", async () => {
      const nonExistentEventId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/events/${nonExistentEventId}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Comment for non-existent event" });
      expect(res.statusCode).toEqual(404);
    });

    it("should fail to update a comment with an invalid token", async () => {
      const resCreate = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Comment to update with wrong user" });
      expect(resCreate.statusCode).toEqual(201);
      const tempCommentId = resCreate.body._id;

      const resUpdate = await request(app)
        .put(`/api/comments/${tempCommentId}`)
        .set("Authorization", `Bearer invalidtoken`)
        .send({ text: "Attempted update" });
      expect(resUpdate.statusCode).toEqual(401);
    });

    it("should fail to delete a comment with an invalid token", async () => {
      const resCreate = await request(app)
        .post(`/api/events/${eventId}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Comment to delete with wrong user" });
      expect(resCreate.statusCode).toEqual(201);
      const tempCommentId = resCreate.body._id;

      const resDelete = await request(app)
        .delete(`/api/comments/${tempCommentId}`)
        .set("Authorization", `Bearer invalidtoken`);
      expect(resDelete.statusCode).toEqual(401);
    });
  });
});