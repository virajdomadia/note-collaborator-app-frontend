import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";
import CreateNoteModal from "../components/CreateNoteModal";
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState("myNotes");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
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
      toast.error("Failed to fetch notes.");
    }
  };

  // Fetch notes when tab/page changes
  useEffect(() => {
    fetchNotes();
  }, [activeTab, currentPage]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("joinUserRoom", user._id); // join personal room for events

    const handleNoteShared = ({ noteId, title }) => {
      toast.info(`A new note "${title}" was shared with you!`);
      if (activeTab === "sharedWithMe") fetchNotes();
    };

    const handleNoteUpdated = ({ noteId, title }) => {
      toast.success(`Note "${title}" was updated.`);
      fetchNotes(); // Optional: only update if on that note
    };

    socket.on("note:shared", handleNoteShared);
    socket.on("noteUpdated", handleNoteUpdated);

    return () => {
      socket.off("note:shared", handleNoteShared);
      socket.off("noteUpdated", handleNoteUpdated);
    };
  }, [socket, user, activeTab]);

  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((n) => n._id !== noteId));
      toast.success("Note deleted successfully.");
    } catch (err) {
      console.error("Error deleting note:", err);
      toast.error("Failed to delete note.");
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-8">
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-xl p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-700 mb-6">My Notes</h3>
        <div className="flex flex-col gap-4">
          <button
            className={`flex items-center text-lg font-medium ${
              activeTab === "myNotes" ? "text-blue-600" : "text-gray-600"
            } transition-all duration-300`}
            onClick={() => {
              setActiveTab("myNotes");
              setCurrentPage(1);
            }}
          >
            <span className="mr-2">📓</span> My Notes
          </button>
          <button
            className={`flex items-center text-lg font-medium ${
              activeTab === "sharedWithMe" ? "text-blue-600" : "text-gray-600"
            } transition-all duration-300`}
            onClick={() => {
              setActiveTab("sharedWithMe");
              setCurrentPage(1);
            }}
          >
            <span className="mr-2">🤝</span> Shared with Me
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-6 flex items-center text-lg font-medium text-red-600 hover:text-red-800 transition-all duration-300"
        >
          <FaSignOutAlt className="mr-2" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 pl-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-semibold text-gray-800">Your Notes</h2>
          <button
            onClick={toggleModal}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-6 rounded-full shadow-md hover:shadow-2xl transition-all duration-300"
          >
            Create New Note
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {notes.length === 0 ? (
            <p className="text-gray-600 col-span-3">No notes available.</p>
          ) : (
            notes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-2xl shadow-xl transition-all duration-300 p-6 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 truncate">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {new Date(
                      note.updatedAt || note.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                <p className="text-gray-600 text-sm line-clamp-4 mb-4">
                  {note.content}
                </p>

                <div className="flex gap-4 mt-auto">
                  <Link to={`/notes/${note._id}`} className="w-full">
                    <button className="w-full py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-300">
                      Edit
                    </button>
                  </Link>
                  {note.createdBy?._id === user._id && (
                    <button
                      className="w-full py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-300"
                      onClick={() => handleDelete(note._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Create Note Modal */}
      {isModalOpen && (
        <CreateNoteModal closeModal={toggleModal} onNoteCreated={fetchNotes} />
      )}
    </div>
  );
};

export default Dashboard;
