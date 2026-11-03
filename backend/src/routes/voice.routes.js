import express from "express";
import multer from "multer";
import path from "path";
import { transcribe } from "../controllers/transcribe.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
});

router.post(
  "/transcribe",
  upload.single("audio"),
  transcribe
);

export default router;