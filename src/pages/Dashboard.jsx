// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";
import CreateNoteModal from "../components/CreateNoteModal";

const Dashboard = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("myNotes");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/notes?page=${currentPage}&tab=${activeTab}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNotes(res.data.notes);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };

    fetchNotes();
  }, [activeTab, currentPage]);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "myNotes"
              ? "border-black text-black"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("myNotes")}
        >
          My Notes
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "sharedWithMe"
              ? "border-black text-black"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("sharedWithMe")}
        >
          Shared with Me
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <p>No notes available.</p>
        ) : (
          notes.map((note) => (
            <div key={note._id} className="p-4 border border-black rounded">
              <h3 className="text-lg font-bold">{note.title}</h3>
              <p>{note.content}</p>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(note.lastUpdated).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Create Note Button */}
      <button
        onClick={toggleModal}
        className="mt-6 bg-black text-white px-4 py-2 rounded"
      >
        Create Note
      </button>

      {/* Create Note Modal */}
      {isModalOpen && <CreateNoteModal closeModal={toggleModal} />}
    </div>
  );
};

export default Dashboard;
