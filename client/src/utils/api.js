import axios from "axios";
export const baseUrl = "http://localhost:3000"; // Replace with your backend API base URL

async function createConversation() {
  const response = await axios.post(`${baseUrl}/conversations`);
  return response.data.conversationId;
}

async function sendMessage(conversationId, message) {
  const response = await axios.post(
    `${baseUrl}/conversations/${conversationId}/message`,
    { message },
  );
  return response.data.message;
}

async function getMessages(conversationId) {
  const response = await axios.get(
    `${baseUrl}/conversations/${conversationId}/messages`,
  );
  return response.data;
}
async function getConversations() {
  try {
    const response = await axios.get(`${baseUrl}/conversations`);
    return response.data;
  } catch (err) {
    console.error("Error retrieving conversations:", err);
    throw new Error("Error retrieving conversations"); // Re-throw for handling in components
  }
}
async function uploadFile(conversationId, file) {
  const formData = new FormData();
  formData.append("data", file); // Assuming the file field name in the backend is 'data'

  try {
    const response = await axios.post(
      `${baseUrl}/conversations/${conversationId}/file`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Set headers for file upload
        },
      },
    );
    return response.data;
  } catch (err) {
    console.error("Error storing uploaded file:", err);
    throw new Error("Error storing uploaded file"); // Re-throw for handling in components
  }
}

export {
  createConversation,
  sendMessage,
  getMessages,
  getConversations,
  uploadFile,
};
