import { useContext, useState } from "react";
import { sendMessage, uploadFile } from "../utils/api";
import { ChatContext } from "../context/ChatContext";

const MessageInput = ({ onSendMessage }) => {
  const { conversationId } = useContext(ChatContext);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "message") {
      setMessage(value);
    } else if (name === "file") {
      setFile(files[0]); // Assuming single file upload
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim()) {
      return; // Prevent empty message submission
    }

    try {
      const newMessage = await sendMessage(conversationId, message);
      const uploadedFile = file ? await uploadFile(conversationId, file) : null; // Upload file if selected

      const data = {
        message: newMessage,
        file: uploadedFile, // Include uploaded file information (if applicable)
      };

      onSendMessage(data); // Call parent function with message and file data

      setMessage(""); // Clear message input after successful submission
      setFile(null); // Clear file selection after upload
    } catch (err) {
      console.error("Error uploading file or sending message:", err);
      // Handle upload or message sending error (e.g., display error message to user)
    }
  };

  return (
    <form
      className="flex items-center absolute w-full bottom-1 right-0 p-4"
      onSubmit={handleSubmit}
    >
      <textarea
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
        name="message"
        value={message}
        onChange={handleChange}
        placeholder="Type your message"
      />
      <label htmlFor="file" className="ml-4 w-10 cursor-pointer">
        <input
          type="file"
          id="file"
          name="file"
          accept=".csv"
          onChange={handleChange}
          hidden
        />
        <img src="/attach.svg" />
      </label>
      <button
        type="submit"
        className="ml-4 w-1/12 text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800"
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;
