// Backend/src/controllers/user.controllers.js
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Request } from "../models/request.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import { uploadOnCloudinary } from "../config/connectCloudinary.js";
import { sendMail } from "../utils/SendMail.js";

export const userDetailsWithoutID = asyncHandler(async (req, res) => {
  console.log("\n******** Inside userDetailsWithoutID Controller ********");
  return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

export const UserDetails = asyncHandler(async (req, res) => {
  console.log("\n******** Inside UserDetails Controller ********");
  const username = req.params.username;

  const user = await User.findOne({ username });
  if (!user) throw new ApiError(404, "User not found");

  const receiverID = user._id;
  const senderID = req.user?._id;

  const request = senderID
    ? await Request.find({
        $or: [
          { sender: senderID, receiver: receiverID },
          { sender: receiverID, receiver: senderID },
        ],
      })
    : [];

  const status = request.length > 0 ? request[0].status : "Connect";
  return res.status(200).json(new ApiResponse(200, { ...user._doc, status }, "User details fetched successfully"));
});

// ✅ FIX: Handle both logged-in and manual (unauthenticated) registration
export const UnRegisteredUserDetails = asyncHandler(async (req, res) => {
  console.log("\n******** Inside UnRegisteredUserDetails Controller ********");

  if (req.user && req.user.type === "unregistered") {
    const user = await UnRegisteredUser.findById(req.user.id).select("-__v");
    return res.status(200).json(new ApiResponse(200, user, "Fetched unregistered user details"));
  }

  return res.status(200).json(new ApiResponse(200, {}, "No user token, new registration flow"));
});

// ✅ Allow save without login (manual registration supported)
export const saveRegUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("\n******** Inside saveRegUnRegisteredUser Controller ********");
  const {
    name,
    email,
    username,
    linkedinLink,
    githubLink,
    portfolioLink,
    skillsProficientAt,
    skillsToLearn,
  } = req.body;

  if (!name || !email || !username)
    throw new ApiError(400, "Please provide name, email, and username");

  const emailLower = email.toLowerCase();
  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;

  if (
    (linkedinLink && !linkedinLink.match(linkedinRegex)) ||
    (githubLink && !githubLink.match(githubRegex))
  ) {
    throw new ApiError(400, "Invalid GitHub or LinkedIn link");
  }

  let user = await UnRegisteredUser.findOne({ email: emailLower });

  if (user) {
    user = await UnRegisteredUser.findOneAndUpdate(
      { email: emailLower },
      { name, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn },
      { new: true }
    );
  } else {
    user = await UnRegisteredUser.create({
      name,
      email: emailLower,
      username,
      linkedinLink,
      githubLink,
      portfolioLink,
      skillsProficientAt,
      skillsToLearn,
    });
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveEduUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveEduUnRegisteredUser ********");
  const { education, email } = req.body;

  if (!education || education.length === 0)
    throw new ApiError(400, "Education is required");

  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) throw new ApiError(400, "Missing education details");
    if (edu.startDate > edu.endDate)
      throw new ApiError(400, "Invalid education dates");
  });

  const emailLower = email.toLowerCase();
  let user = await UnRegisteredUser.findOne({ email: emailLower });

  if (user) {
    user = await UnRegisteredUser.findOneAndUpdate(
      { email: emailLower },
      { education },
      { new: true }
    );
  } else {
    user = await UnRegisteredUser.create({ email: emailLower, education });
  }

  return res.status(200).json(new ApiResponse(200, user, "Education saved successfully"));
});

export const saveAddUnRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveAddUnRegisteredUser ********");
  const { bio, projects, email } = req.body;

  if (!bio) throw new ApiError(400, "Bio is required");
  const emailLower = email.toLowerCase();

  let user = await UnRegisteredUser.findOne({ email: emailLower });
  if (user) {
    user = await UnRegisteredUser.findOneAndUpdate(
      { email: emailLower },
      { bio, projects },
      { new: true }
    );
  } else {
    user = await UnRegisteredUser.create({ email: emailLower, bio, projects });
  }

  return res.status(200).json(new ApiResponse(200, user, "Additional details saved successfully"));
});

// ✅ FIXED: allow manual registration + delete temp data + create main user
export const registerUser = asyncHandler(async (req, res) => {
  console.log("\n******** Inside registerUser ********");

  const {
    name,
    email,
    username,
    linkedinLink,
    githubLink,
    portfolioLink,
    skillsProficientAt,
    skillsToLearn,
    education,
    bio,
    projects,
  } = req.body;

  const emailLower = email.toLowerCase();

  const existingUser = await User.findOne({ email: emailLower });
  if (existingUser) throw new ApiError(400, "User already registered");

  const checkUsername = await User.findOne({ username });
  if (checkUsername) throw new ApiError(400, "Username already exists");

  const newUser = await User.create({
    name,
    email: emailLower,
    username,
    linkedinLink,
    githubLink,
    portfolioLink,
    skillsProficientAt,
    skillsToLearn,
    education,
    bio,
    projects,
    picture: req.user?.picture || "",
  });

  await UnRegisteredUser.deleteMany({ email: emailLower });

  const jwtToken = generateJWTToken_username(newUser);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);

  res.cookie("accessToken", jwtToken, {
    httpOnly: true,
    expires: expiryDate,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.clearCookie("accessTokenRegistration");
  return res.status(201).json(new ApiResponse(201, newUser, "User registered successfully"));
});

export const saveRegRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveRegRegisteredUser ********");
  const { name, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn, picture } =
    req.body;

  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;

  if (
    (linkedinLink && !linkedinLink.match(linkedinRegex)) ||
    (githubLink && !githubLink.match(githubRegex))
  ) {
    throw new ApiError(400, "Invalid GitHub/LinkedIn links");
  }

  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    { name, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn, picture },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, user, "Registered user details updated"));
});

export const saveEduRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveEduRegisteredUser ********");
  const { education } = req.body;

  education.forEach((edu) => {
    if (!edu.institution || !edu.degree)
      throw new ApiError(400, "Missing education details");
  });

  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    { education },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, user, "Education updated"));
});

export const saveAddRegisteredUser = asyncHandler(async (req, res) => {
  console.log("******** Inside saveAddRegisteredUser ********");
  const { bio, projects } = req.body;

  if (!bio) throw new ApiError(400, "Bio required");

  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    { bio, projects },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, user, "Additional details updated"));
});

export const uploadPic = asyncHandler(async (req, res) => {
  const localPath = req.files?.picture?.[0]?.path;
  if (!localPath) throw new ApiError(400, "Picture is required");

  const picture = await uploadOnCloudinary(localPath);
  if (!picture) throw new ApiError(500, "Error uploading picture");

  return res.status(200).json(new ApiResponse(200, { url: picture.url }, "Picture uploaded successfully"));
});

export const discoverUsers = asyncHandler(async (req, res) => {
  console.log("******** Inside discoverUsers ********");

  const users = await User.find({ username: { $ne: req.user.username } });
  if (!users) throw new ApiError(500, "Error fetching users");

  users.sort(() => Math.random() - 0.5);
  return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const sendScheduleMeet = asyncHandler(async (req, res) => {
  console.log("******** Inside sendScheduleMeet ********");
  const { date, time, username } = req.body;

  if (!date || !time || !username) throw new ApiError(400, "All fields required");

  const user = await User.findOne({ username });
  if (!user) throw new ApiError(404, "User not found");

  const to = user.email;
  const subject = "Request for Scheduling a meeting";
  const message = `${req.user.name} has requested a meet on ${date} at ${time}.`;

  await sendMail(to, subject, message);
  return res.status(200).json(new ApiResponse(200, null, "Email sent successfully"));
});
