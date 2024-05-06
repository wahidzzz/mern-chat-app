import { useState, useEffect, useContext } from "react";
import { getMessages } from "../utils/api";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { ChatContext } from "../context/ChatContext";

const ConversationList = () => {
  const { conversationId } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    const fetchedMessages = await getMessages(conversationId);
    setMessages(fetchedMessages);
  };
  useEffect(() => {
    console.log(conversationId);
    fetchMessages();
    return () => {};
  }, [conversationId]);

  const handleSendMessage = (newMessage) => {
    console.log("New message:", newMessage);
    fetchMessages();
  };
  return (
    <>
      <div className="flex flex-col h-full overflow-auto space-y-2 mb-10">
        {messages.map((message) => (
          <Message
            key={message.id}
            user={message.user}
            response={message.response}
            filename={message?.filename}
          />
        ))}
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </>
  );
};

export default ConversationList;
