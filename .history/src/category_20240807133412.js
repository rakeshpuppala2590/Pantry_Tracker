import OpenAI from "openai";
import fs from "fs";
const openai = new OpenAI();
const base64Image = fs.readFileSync("");
