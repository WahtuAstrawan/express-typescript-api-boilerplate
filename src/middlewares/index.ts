import express from "express";
import { get, identity, merge } from "lodash";

import { getUserBySessionToken } from "../db/users";

export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { id } = req.params;
    const currentUserId = get(req, "identity._id") as string;

    if (!currentUserId) {
      return res.status(403).json({
        success: false,
        message: "No user identity found.",
      });
    }

    if (currentUserId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this data.",
      });
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const sessionToken = req.cookies["TOKEN"];

    if (!sessionToken) {
      return res.status(403).json({
        success: false,
        message: "Not authenticated, login again.",
      });
    }

    const existingUser = await getUserBySessionToken(sessionToken);

    if (!existingUser) {
      return res.status(403).json({
        success: false,
        message: "Token expired or unknown, login again.",
      });
    }

    merge(req, { identity: existingUser });

    return next();
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};
