/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API Client
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("[SW/WARAID]: process.env.GEMINI_API_KEY is not configured yet. AI Assistant will trigger offline mode.");
      throw new Error("GEMINI_API_KEY environment variable is required for online AI operations");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Real-World SMS Carrier Integration Router (Twilio Gateway)
app.post("/api/send-sms", async (req, res) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) {
      res.status(400).json({ error: "Missing required 'to' or 'body' inputs." });
      return;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      res.status(412).json({
        success: false,
        error: "TWILIO_CREDENTIALS_MISSING",
        message: "Your Twilio Carrier credentials are not configured inside the server environment. Provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in settings to send messages to actual cell phones."
      });
      return;
    }

    // Direct HTTP request to official Twilio POST resource without heavy external SDK container burden
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", to.trim());
    params.append("From", fromNumber.trim());
    params.append("Body", body.trim());

    console.log(`[WARAID-SMS]: Initiating direct REST payload transmission to ${to}`);
    const twilioResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await twilioResponse.json() as any;

    if (twilioResponse.ok) {
      console.log(`[WARAID-SMS]: Successful carrier dispatch. SID=${data.sid}`);
      res.json({
        success: true,
        sid: data.sid,
        status: data.status,
        message: `Real carriers matched. Message sent successfully! Status: ${data.status}`
      });
    } else {
      console.error(`[WARAID-SMS]: Carrier gateway error response: ${JSON.stringify(data)}`);
      res.status(twilioResponse.status).json({
        success: false,
        error: "CARRIER_DISPATCH_REJECTED",
        message: data.message || "Twilio gateway rejected dispatch registration."
      });
    }
  } catch (err: any) {
    console.error("[WARAID-SMS]: Fatal networking driver error:", err);
    res.status(500).json({
      success: false,
      error: "DRIVER_EXCEPTION",
      message: err.message
    });
  }
});

// REST API endpoint for multi-agent coordination
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, agent, language, location, markers } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: "Missing required parameter 'prompt'" });
      return;
    }

    const client = getGeminiClient();

    // Map system instructions depending on the active agent
    let systemInstruction = "You are WarAid AI, an emergency backup advisor operating in a crisis zone.";
    
    if (agent === "MedAgent") {
      systemInstruction = `You are "MedAgent", a specialized tactical field surgeon and trauma specialist. 
      Deliver immediate, concise, step-by-step first aid guidance. Do not include flowery text; prioritize stopping severe bleeding, burn cooling, bone setting, or CPR techniques.
      Always structure responses using bold headers. You must respond in the requested language: "${language}".`;
    } else if (agent === "SurvivalAgent") {
      systemInstruction = `You are "SurvivalAgent", an elite military survival and disasters advisor. 
      Advise clearly, step-by-step, on active shelling, artillery bombardments, radiation hazards, structure blockage, and active shooter defense.
      Be authoritative, clear, and focused on immediate survival actions. You must respond in the requested language: "${language}".`;
    } else if (agent === "ResourceAgent") {
      systemInstruction = `You are "ResourceAgent", a supply logistics and shelter search coordinator. 
      You will accept the user's current GPS location: ${JSON.stringify(location)} and the surrounding map markers: ${JSON.stringify(markers)}.
      Tell the user exactly which shelter or station they can reach. Estimate distances and provide exact guidelines for traveling safely without drawing drone fire or artillery focus.
      Be concise and localized. You must respond in the requested language: "${language}".`;
    } else if (agent === "DisasterAgent") {
      systemInstruction = `You are "DisasterAgent", a natural catastrophe survival advisor. 
      Instruct clearly on surviving cyclones, storms, mudslides, rising floods, water contamination, earthquakes, and wildfire storms.
      Include short checklists with clear bold numbers. You must respond in the requested language: "${language}".`;
    } else {
      systemInstruction = `You are the WarAid Unified Assistant. Answer the user's general crisis management questions, help coordinate language switching, or explain app features (Mesh P2P Chat, Rescue Map, Aid Digital ID, Volunteer Hub).
      You must respond in the requested language: "${language}".`;
    }

    // Add grounding guidelines
    const fullPrompt = `The citizen is asking: "${prompt}".
    Current Coordinates: ${JSON.stringify(location || { lat: 50.4501, lng: 30.5234 })}.
    Surrounding shelters available offline: ${JSON.stringify(markers || [])}.
    
    Format your response in neat, highly scannable Markdown. Use bullet points and warning callouts. Do not mention API keys or software internals. Remain calm and reassuring.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Keep it highly factual and deterministic during catastrophes
      }
    });

    const bodyText = response.text || "No response received from the triage core.";
    res.json({ text: bodyText });
  } catch (err: any) {
    console.error("Gemini request failed:", err);
    res.status(500).json({ 
      error: "AI operation failed", 
      message: err.message,
      explanation: "This occurs if your GEMINI_API_KEY is missing or the request timed out. We will fallback automatically to autonomous on-device databases."
    });
  }
});

// Simulate mock health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", meshActive: true, time: new Date().toISOString() });
});

async function startServer() {
  // Vite integration for dev server or static builds for static server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WARAID-SERVER] Server booted safely on port ${PORT} (host 0.0.0.0)`);
    console.log(`[WARAID-SERVER] Ready for P2P routing overlays.`);
  });
}

startServer();
