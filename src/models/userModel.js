import db from "./db.js";
import bcrypt from "bcryptjs";

export const registerUser = async (username, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword]
  );
  return { id: result.insertId, username };
};

export const findUserByUsername = async (username) => {
  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0];
};
