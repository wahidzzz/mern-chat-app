const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const OpenAI = require("openai");
const { v4: uuidv4 } = require("uuid");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: "<OPEN_AI_API_KEY>",
});
app.use(cors());
app.use(bodyParser.json());
const db = new sqlite3.Database("./database/conversations.db");

db.run(`CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  messages TEXT NOT NULL
)`);

function createConversation() {
  const conversationId = uuidv4();
  db.run(`INSERT INTO conversations (id, messages) VALUES (?, ?)`, [
    conversationId,
    JSON.stringify([]),
  ]);
  return conversationId;
}

function getConversation(conversationId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT messages FROM conversations WHERE id = ?`,
      [conversationId],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? JSON.parse(row.messages) : []);
        }
      },
    );
  });
}
async function getAllConversations() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, messages FROM conversations `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const conversations = rows
          .filter((row) => JSON.parse(row.messages).length > 0)
          .map((row) => ({
            id: row.id,
            lastMessage:
              JSON.parse(row.messages)[JSON.parse(row.messages).length - 1]
                ?.user || "",
          }));
        resolve(conversations);
      }
    });
  });
}
function storeMessage(conversationId, message) {
  getConversation(conversationId)
    .then((messages) => {
      messages.push(message);
      db.run(`UPDATE conversations SET messages = ? WHERE id = ?`, [
        JSON.stringify(messages),
        conversationId,
      ]);
    })
    .catch((err) => console.error("Error storing message:", err));
}

function storeFile(conversationId, file) {
  return new Promise((resolve, reject) => {
    const filename = file.originalname;

    const filePath = `uploads/${filename}`; // Replace with your secure storage path
    const fileMove = require("fs").promises.rename(file.path, filePath);

    fileMove
      .then(() => {
        getConversation(conversationId)
          .then((messages) => {
            messages.push({ filename }); // Add filename to conversation messages
            db.run(`UPDATE conversations SET messages = ? WHERE id = ?`, [
              JSON.stringify(messages),
              conversationId,
            ]);
            resolve({ filename }); // Resolve with filename for response
          })
          .catch((err) => {
            console.error("Error storing file metadata:", err);
            reject(err); // Reject promise on error
          });
      })
      .catch((err) => {
        console.error("Error moving uploaded file:", err);
        reject(err); // Reject promise on error
      });
  });
}

// API Endpoints

app.post("/conversations", (req, res) => {
  const conversationId = createConversation();
  res.json({ conversationId });
});

app.post("/conversations/:conversationId/message", async (req, res) => {
  const conversationId = req.params.conversationId;
  const message = req.body.message;
  try {
    const response = await processMessageWithOpenAI(message, conversationId);
    console.log(response); // Log the response for debugging

    storeMessage(conversationId, { user: message, response }); // Store message in the database

    res.json({ message: { user: message, response } }); // Send response back to client
  } catch (err) {
    console.error("Error processing message:", err);
    res
      .status(500)
      .json({ error: "Something went wrong. Please try again later." }); // Handle errors
  }
});
app.get("/conversations/:conversationId/messages", (req, res) => {
  const conversationId = req.params.conversationId;
  getConversation(conversationId)
    .then((messages) => res.json(messages))
    .catch((err) =>
      res.status(500).json({ error: "Error retrieving messages" }),
    );
});

app.post(
  "/conversations/:conversationId/file",
  upload.single("data"),
  async (req, res) => {
    const conversationId = req.params.conversationId;
    console.log(req, "file req");
    const file = req.file;

    try {
      const storedFile = await storeFile(conversationId, file);
      res.json(storedFile);
    } catch (err) {
      res.status(500).json({ error: "Error storing uploaded file" });
    }
  },
);

app.get("/conversations/:conversationId/files", (req, res) => {
  const conversationId = req.params.conversationId;
  getConversation(conversationId)
    .then((messages) => {
      const filenames = messages.map((message) => message.filename);
      res.json(filenames); // Return an array of filenames
    })
    .catch((err) =>
      res.status(500).json({ error: "Error retrieving uploaded files" }),
    );
});

app.get("/conversations/:conversationId", (req, res) => {
  const conversationId = req.params.conversationId;
  getConversation(conversationId)
    .then((messages) => {
      res.json({ messages });
    })
    .catch((err) =>
      res.status(500).json({ error: "Error retrieving conversation details" }),
    );
});

app.get("/conversations", async (req, res) => {
  try {
    const conversations = await getAllConversations(); // Replace with your function
    res.json(conversations);
  } catch (err) {
    console.error("Error retrieving conversations:", err);
    res.status(500).json({ error: "Error retrieving conversations" });
  }
});

async function processMessageWithOpenAI(message, conversationId) {
  const conversation = getConversation(conversationId); // Retrieve conversation history

  let context = "";
  if (conversation?.messages?.length > 0) {
    context = conversation?.messages.map((msg) => msg.user).join("\n");
  }

  let fileData = "";
  const conversationFiles = getConversation(conversationId)?.files;
  if (conversationFiles?.length > 0) {
    fileData = JSON.stringify(
      processUploadedFile(conversationFiles[conversationFiles?.length - 1]),
    );
  }

  let prompt = `Answer the user's financial question in a comprehensive and informative way: ${message}`;

  if (context) {
    prompt += `\nContext:\n${context}`;
  }

  if (fileData) {
    prompt += `\nData from uploaded CSV: ${fileData}`;
  }

  prompt += `\nHere are some additional resources that might be helpful:`;

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });
    const res = [];
    for await (const chunk of stream) {
      res.push(chunk.choices[0]?.delta?.content || "");
    }
    return res;
  } catch (error) {
    console.error(error);
    return "Something went wrong. Please try again later.";
  }
}

function processUploadedFile(file) {
  const fs = require("fs");

  try {
    const data = fs.readFileSync(file.path, "utf8");
    const lines = data.split("\n");

    const headers = lines[0].split(",");
    const financialData = [];
    for (let i = 1; i < lines.length; i++) {
      const rowData = lines[i].split(",");
      const rowObject = {};
      for (let j = 0; j < headers.length; j++) {
        rowObject[headers[j].trim()] = rowData[j].trim();
      }
      financialData.push(rowObject);
    }

    return financialData;
  } catch (error) {
    console.error("Error processing uploaded file:", error);
    return {};
  }
}

app.listen(3000, () => console.log("Server listening on port 3000"));
