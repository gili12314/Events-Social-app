import request from "supertest";
import app from "../server";

describe("Events Endpoints", () => {
  let token: string;
  let eventId: string;
  const uniqueEmail = `eventtest_${Date.now()}@example.com`;
  const eventData = {
    title: "Test Event",
    description: "This is a test event",
    date: "2023-12-31T20:00:00.000Z",
    location: "Test Location",
  };

  beforeAll(async () => {
    const resRegister = await request(app)
      .post("/api/auth/register")
      .send({
        username: "eventTester",
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
    it("should create a new event", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${token}`)
        .send(eventData);
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("_id");
      eventId = res.body._id;
    });

    it("should update the event", async () => {
      const res = await request(app)
        .put(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated Test Event" });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Event updated successfully");
      expect(res.body.event.title).toEqual("Updated Test Event");
    });

    it("should join the event", async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/join`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Successfully joined the event");
    });

    it("should like the event", async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/like`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Like added");
    });

    it("should delete the event", async () => {
      const res = await request(app)
        .delete(`/api/events/${eventId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("message", "Event deleted successfully");
    });
  });

  describe("Failure and edge cases", () => {
    it("should fail to create an event without authorization", async () => {
      const res = await request(app)
        .post("/api/events")
        .send(eventData);
      expect(res.statusCode).toEqual(401);
    });

    it("should return 404 when updating a non-existent event", async () => {
      const nonExistentEventId = "60d9f9f9f9f9f9f9f9f9f9f9";
      const res = await request(app)
        .put(`/api/events/${nonExistentEventId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Should not update" });
      expect(res.statusCode).toEqual(404);
    });

    it("should return 404 when joining a non-existent event", async () => {
      const nonExistentEventId = "60d9f9f9f9f9f9f9f9f9f9f9";
      const res = await request(app)
        .post(`/api/events/${nonExistentEventId}/join`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(404);
    });

    it("should return 404 when liking a non-existent event", async () => {
      const nonExistentEventId = "60d9f9f9f9f9f9f9f9f9f9f9";
      const res = await request(app)
        .post(`/api/events/${nonExistentEventId}/like`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(404);
    });

    it("should return 404 when deleting a non-existent event", async () => {
      const nonExistentEventId = "60d9f9f9f9f9f9f9f9f9f9f9";
      const res = await request(app)
        .delete(`/api/events/${nonExistentEventId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});
