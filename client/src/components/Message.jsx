import { baseUrl } from "../utils/api";
const Message = ({ user, response, filename }) => {
  return (
    <div className="flex items-center">
      <div className="flex-grow bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
        {user && <p className="font-bold">{user}</p>}
        {response && <p>{response}</p>}
        {filename && (
          <div className="mt-2">
            <a
              href={`${baseUrl}/uploads/${filename}`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-500 hover:underline"
            >
              {filename} (Download)
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
