import { useState, useEffect, useContext } from "react";
import { getConversations } from "../utils/api"; // Replace with your API call function
import { ChatContext } from "../context/ChatContext";

const LastConversations = () => {
  const { setConversationId } = useContext(ChatContext);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const fetchedConversations = await getConversations();
      setConversations(fetchedConversations);
    };

    fetchConversations();
  }, []);

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="w-full p-4 h-screen overflow-auto">
        <h3 className="mb-2 text-lg font-bold">Last Conversations</h3>
        <ul className="list-none space-y-2">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              className="hover:bg-gray-100 px-2 py-1 rounded-lg cursor-pointer"
              onClick={() => setConversationId(conversation.id)}
            >
              {conversation.lastMessage || "No messages yet"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LastConversations;
