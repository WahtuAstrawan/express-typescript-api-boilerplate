import express from "express";

import { deleteUserById, getUserById, getUsers } from "../db/users";
import { authentication, random } from "../helpers";

export const getAllUsers = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const users = await getUsers();

    return res.status(200).json({
      success: true,
      message: "Successfully fetching all users data.",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};

export const deleteUser = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User id not valid.",
      });
    }

    await deleteUserById(id);

    res.clearCookie("TOKEN");

    return res.status(200).json({
      success: true,
      message: `Successfully delete user with id: ${id}`,
      deletedUser: existingUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};

export const updateUser = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username && !password) {
      return res.status(400).json({
        success: false,
        message: "Required at least a username or password to update.",
      });
    }

    const user = await getUserById(id).select(
      "+authentication.salt +authentication.password"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User id not valid.",
      });
    }

    if (username && user.username != username) {
      user.username = username;
    }

    if (password) {
      const salt = random();
      user.authentication.salt = salt;
      user.authentication.password = authentication(salt, password);
    }

    await user.save();

    res.clearCookie("TOKEN");

    return res.status(200).json({
      success: true,
      message: `Successfully update user with id: ${id}`,
      updatedUser: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: "Something wrong happen.",
    });
  }
};
