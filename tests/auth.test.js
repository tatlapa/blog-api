const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");

describe("Auth Routes", () => {
  beforeAll(async () => {
    // Connexion à une base de test
    await mongoose.connect(
      process.env.MONGODB_URI_TEST || "mongodb://localhost:27017/blog-api-test"
    );
  });

  afterAll(async () => {
    // Nettoyer et fermer la connexion
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Nettoyer la base avant chaque test
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should return error for invalid email", async () => {
      const userData = {
        username: "testuser",
        email: "invalid-email",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it("should return error for duplicate email", async () => {
      // Créer un utilisateur
      await User.create({
        username: "existinguser",
        email: "test@example.com",
        password: "Password123",
      });

      const userData = {
        username: "newuser",
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("email");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      await User.create({
        username: "testuser",
        email: "test@example.com",
        password: "Password123",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it("should return error for invalid password", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("incorrect");
    });

    it("should return error for non-existent email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "Password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("incorrect");
    });
  });

  describe("GET /api/auth/me", () => {
    let token;
    let user;

    beforeEach(async () => {
      // Créer un utilisateur et obtenir un token
      user = await User.create({
        username: "testuser",
        email: "test@example.com",
        password: "Password123",
      });
      token = user.generateAuthToken();
    });

    it("should return user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should return error without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Token");
    });

    it("should return error with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("invalide");
    });
  });
});
