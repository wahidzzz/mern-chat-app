import { useState } from "react";
import { createConversation } from "./utils/api";
import ConversationList from "./components/ConversationList";
import LastConversations from "./components/LastConversations";
import { ChatContext } from "./context/ChatContext";

const App = () => {
  const [conversationId, setConversationId] = useState(null);

  const initConversation = async () => {
    const newConversationId = await createConversation();
    setConversationId(newConversationId);
  };

  return (
    <ChatContext.Provider value={{ conversationId, setConversationId }}>
      <div className="flex flex-col h-screen bg-gray-200">
        <div className="flex h-screen">
          <LastConversations />
          <main className="flex-grow p-4 relative">
            {conversationId ? (
              <>
                <ConversationList />
              </>
            ) : (
              <>
                <button
                  onClick={() => initConversation()}
                  type="button"
                  className="absolute bottom-1 p-4 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                >
                  Start New Chat
                </button>
              </>
            )}
          </main>
        </div>
      </div>
    </ChatContext.Provider>
  );
};

export default App;
