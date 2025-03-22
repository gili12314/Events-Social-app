import request from "supertest";
import app from "../server";

describe("Comments Endpoints", () => {
  let token: string;
  let eventId: string;
  let commentId: string;
  // שימוש באימייל ייחודי למניעת התנגשויות
  const uniqueEmail = `commenttest_${Date.now()}@example.com`;

  beforeAll(async () => {
    // רישום והתחברות למשתמש עבור בדיקות תגובות
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

    // יצירת אירוע לבדיקה
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
    // ניקוי: מחיקת האירוע שנוצר
    await request(app)
      .delete(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${token}`);
  });

  describe("Success scenarios", () => {
    it("should create a new comment", async () => {
      const res = await request(app)
        .post(`/api/comments/${eventId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "This is a test comment." });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("_id");
      commentId = res.body._id;
    });

    it("should get comments for the event", async () => {
      const res = await request(app)
        .get(`/api/comments/${eventId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should update the comment", async () => {
      const res = await request(app)
        .put(`/api/comments/update/${commentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Updated comment text." });
      expect(res.statusCode).toEqual(200);
      expect(res.body.text).toEqual("Updated comment text.");
    });

    it("should delete the comment", async () => {
      const res = await request(app)
        .delete(`/api/comments/delete/${commentId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Comment deleted successfully");
    });
  });

  describe("Failure and edge cases", () => {
    it("should fail to create a comment without authorization header", async () => {
      const res = await request(app)
        .post(`/api/comments/${eventId}`)
        .send({ text: "Unauthorized comment" });
      expect(res.statusCode).toEqual(401);
    });

    it("should fail to create a comment for a non-existent event", async () => {
      const nonExistentEventId = "60d9f9f9f9f9f9f9f9f9f9f9";
      const res = await request(app)
        .post(`/api/comments/${nonExistentEventId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Comment for non-existent event" });
      expect(res.statusCode).toEqual(404);
    });

    it("should fail to update a comment with an invalid token", async () => {
      // יצירת תגובה חדשה
      const resCreate = await request(app)
        .post(`/api/comments/${eventId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Comment to update with wrong user" });
      expect(resCreate.statusCode).toEqual(201);
      const tempCommentId = resCreate.body._id;

      // ניסיון לעדכן עם טוקן לא תקין
      const resUpdate = await request(app)
        .put(`/api/comments/update/${tempCommentId}`)
        .set("Authorization", `Bearer invalidtoken`)
        .send({ text: "Attempted update" });
      expect(resUpdate.statusCode).toEqual(401);
    });

    it("should fail to delete a comment with an invalid token", async () => {
      // יצירת תגובה חדשה
      const resCreate = await request(app)
        .post(`/api/comments/${eventId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "Comment to delete with wrong user" });
      expect(resCreate.statusCode).toEqual(201);
      const tempCommentId = resCreate.body._id;

      // ניסיון למחוק עם טוקן לא תקין
      const resDelete = await request(app)
        .delete(`/api/comments/delete/${tempCommentId}`)
        .set("Authorization", `Bearer invalidtoken`);
      expect(resDelete.statusCode).toEqual(401);
    });
  });
});
