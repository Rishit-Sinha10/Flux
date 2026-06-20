import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
export default function Dashboard() {
  const [streams, setStreams] = useState([]);
  const navigate=useNavigate();  
  useEffect(() => {
    const fetchStreams = async () => {
      const res = await fetch("http://localhost:5000/api/streams/live");
      const data = await res.json();
      setStreams(data);
    };

    fetchStreams();
  }, []);
  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {streams.map((stream) => (
        <div
          key={stream._id}
          onClick={() => navigate(`/stream/${stream._id}`)}  // 👈 HERE
          className="bg-white shadow-lg rounded-2xl p-4 hover:scale-105 transition cursor-pointer"
        >
          <img
            src={stream.thumbnail || "https://via.placeholder.com/300"}
            className="rounded-xl mb-3"
          />
          <h2 className="text-lg font-bold">{stream.title}</h2>
          <p className="text-gray-500">
            {stream.creator.username}
          </p>
          <p className="text-red-500 font-semibold">
            🔴 {stream.viewers} watching
          </p>
        </div>
      ))}
    </div>
  );
}