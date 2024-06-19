import express from "express";

import { createUser, getUserByEmail } from "../db/users";
import { authentication, random } from "../helpers";

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await getUserByEmail(email).select(
      "+authentication.salt +authentication.password"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found, register first.",
      });
    }

    const expectedHash = authentication(user.authentication.salt, password);
    if (user.authentication.password !== expectedHash) {
      return res.status(403).json({
        success: false,
        message: "Your credentials does not match our records.",
      });
    }

    const salt = random();

    user.authentication.sessionToken = authentication(
      salt,
      user._id.toString()
    );

    await user.save();

    res.cookie("TOKEN", user.authentication.sessionToken, {
      maxAge: 900000,
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Login successfully.",
        user: user,
      })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and username are required.",
      });
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User email already created.",
      });
    }

    const salt = random();
    const user = await createUser({
      email,
      username,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "New user created.",
        user: user,
      })
      .end();
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};

export const logout = (req: express.Request, res: express.Response) => {
  try {
    res.clearCookie("TOKEN");
    return res.status(200).json({
      success: true,
      message: "Logout successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};
