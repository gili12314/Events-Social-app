const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Events API",
        version: "1.0.0",
        description: "תיעוד API לאפליקציית האירועים",
      },
      servers: [
        {
          url: "http://localhost:3000/api", 
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          Event: {
            type: "object",
            properties: {
              _id: { type: "string", example: "67dd65ad836e9dc09f17f01b" },
              title: { type: "string", example: "Birthday Party" },
              description: { type: "string", example: "Celebration at my house" },
              image: { type: "string", example: "/uploads/event-image.jpg" },
              date: { type: "string", format: "date-time", example: "2023-12-31T20:00:00.000Z" },
              location: { type: "string", example: "Tel Aviv" },
              createdBy: { type: "string", example: "67dd65ad836e9dc09f17f01b" },
              participants: {
                type: "array",
                items: { type: "string" },
                example: ["67dd65ad836e9dc09f17f01b", "67dd65ad836e9dc09f17f01c"],
              },
              likes: {
                type: "array",
                items: { type: "string" },
                example: ["67dd65ad836e9dc09f17f01b"],
              },
            },
          },
          Comment: {
            type: "object",
            properties: {
              _id: { type: "string", example: "comment123" },
              text: { type: "string", example: "This is a comment" },
              createdAt: { type: "string", format: "date-time", example: "2023-05-01T12:00:00.000Z" },
              user: {
                type: "object",
                properties: {
                  _id: { type: "string", example: "67dd65ad836e9dc09f17f01b" },
                  username: { type: "string", example: "gili" },
                },
              },
            },
          },
          Notification: {
            type: "object",
            properties: {
              _id: { type: "string", example: "notif123" },
              recipient: { type: "string", example: "67dd65ad836e9dc09f17f01b" },
              sender: { type: "string", example: "67dd65ad836e9dc09f17f01c" },
              event: { type: "string", example: "67dd65ad836e9dc09f17f01d" },
              type: { type: "string", example: "like" },
              isRead: { type: "boolean", example: false },
              createdAt: { type: "string", format: "date-time", example: "2023-05-01T12:00:00.000Z" },
            },
          },
          User: {
            type: "object",
            properties: {
              _id: { type: "string", example: "67dd65ad836e9dc09f17f01b" },
              username: { type: "string", example: "gili" },
              email: { type: "string", example: "gil@salton.com" },
              profileImage: { type: "string", example: "/uploads/profile.jpg" },
            },
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
  };
  
  export default options;
  