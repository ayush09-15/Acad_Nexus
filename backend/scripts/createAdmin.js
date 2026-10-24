require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const User = require("../src/models/User");

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askPassword = (question) =>
  new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let password = "";

    const onData = (key) => {
      const char = key.toString();

      if (char === "\u0003") {
        process.exit();
      }

      if (char === "\r" || char === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (char === "\u007f") {
        password = password.slice(0, -1);
        return;
      }

      password += char;
    };

    process.stdin.on("data", onData);
  });

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    const adminExists = await User.exists({ role: "admin" });

    if (adminExists) {
      throw new Error(
        "An admin account already exists. No account was created."
      );
    }

    const name = (await ask("Admin name: ")).trim();
    const email = (await ask("Admin email: ")).trim().toLowerCase();
    const password = await askPassword("Admin password (min 8 characters): ");

    if (!name || !email || password.length < 8) {
      throw new Error("Enter a name, valid email, and password of at least 8 characters.");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("This email is already registered. No account was created.");
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      professorApproved: false,
    });

    console.log(`Admin created successfully: ${admin.email}`);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
