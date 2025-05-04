import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CollaboratorModal from "../components/CollaboratorModal";
import { useSocket } from "../context/SocketContext";

const NoteEditor = () => {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const socket = useSocket();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Fetch note on mount
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await axios.get(
          `https://note-collaborator-app-backend.onrender.com/api/notes/${noteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNote(res.data);
      } catch (err) {
        console.error("Error fetching note:", err);
        if (err.response?.status === 404) {
          toast.error("Note not found.");
        } else {
          toast.error("Failed to load note.");
        }
      }
    };

    if (noteId) {
      fetchNote();
    }
  }, [noteId, token]);

  useEffect(() => {
    if (!noteId || !socket) return; // Ensure socket is defined

    // Join the note room to receive updates
    socket.emit("joinNoteRoom", noteId);

    // Listen for note update events
    socket.on("noteUpdated", (updatedNote) => {
      if (updatedNote._id === noteId) {
        setNote(updatedNote);
        toast.info("Note updated by collaborator.");
      }
    });

    return () => {
      socket.off("noteUpdated");
    };
  }, [noteId, socket]);

  const debouncedSave = useRef(
    debounce(async (updatedNote) => {
      try {
        await axios.put(
          `https://note-collaborator-app-backend.onrender.com/api/notes/${noteId}`,
          updatedNote,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Note saved");
        socket.emit("updateNote", updatedNote);
      } catch (err) {
        toast.error("Failed to save note");
      }
    }, 1000)
  ).current;

  const handleTitleChange = (e) => {
    const updated = { ...note, title: e.target.value };
    setNote(updated);
    debouncedSave(updated);
  };

  const handleContentChange = (e) => {
    const updated = { ...note, content: e.target.value };
    setNote(updated);
    debouncedSave(updated);
  };

  const handleGoBack = () => {
    navigate(-1); // Navigate to the previous page
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await axios.delete(
        `https://note-collaborator-app-backend.onrender.com/api/notes/${noteId}/collaborators/${collaboratorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Collaborator removed");

      // Update the collaborators list after removal
      setNote((prevNote) => ({
        ...prevNote,
        collaborators: prevNote.collaborators.filter(
          (collab) => collab.user._id !== collaboratorId
        ),
      }));
    } catch (err) {
      toast.error("Failed to remove collaborator");
    }
  };

  if (!note)
    return <p className="text-center text-gray-600">Loading note...</p>;

  return (
    <div className="container mx-auto p-6 bg-white shadow-lg rounded-lg max-w-4xl">
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Go Back
        </button>
      </div>

      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Edit Note</h2>

      {/* Note Title */}
      <input
        type="text"
        value={note.title}
        onChange={handleTitleChange}
        placeholder="Note title"
        className="w-full p-4 text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
      />

      {/* Content Area */}
      <textarea
        value={note.content}
        onChange={handleContentChange}
        placeholder="Write your note..."
        rows={15}
        className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-6 min-h-[300px]"
      />

      {/* Toolbar and Share Button */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowShareModal(true)}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Share with Collaborators
        </button>

        {showShareModal && (
          <CollaboratorModal
            noteId={noteId}
            closeModal={() => setShowShareModal(false)}
            onCollaboratorsUpdated={() => {
              // Refetch the note to update collaborators list immediately
              axios
                .get(
                  `https://note-collaborator-app-backend.onrender.com/api/notes/${noteId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                )
                .then((res) => setNote(res.data))
                .catch(() => toast.error("Failed to refresh collaborators"));
            }}
          />
        )}
      </div>

      {/* Collaborator List */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
        <h4 className="font-semibold text-xl text-gray-700 mb-4">
          Collaborators:
        </h4>
        <ul className="space-y-3">
          {note.collaborators?.map((collab) => (
            <li
              key={collab.user._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-3 rounded-md shadow border"
            >
              <div>
                <p className="text-gray-700 font-medium">
                  {collab.user.name} ({collab.user.email})
                </p>
              </div>

              <div className="flex items-center mt-2 md:mt-0 space-x-4">
                {/* Permission dropdown */}
                <select
                  value={collab.permission}
                  onChange={async (e) => {
                    const newPermission = e.target.value;
                    try {
                      await axios.put(
                        `https://note-collaborator-app-backend.onrender.com/api/notes/${noteId}/collaborators/${collab.user._id}`,
                        { permission: newPermission },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                      toast.success("Permission updated");

                      // Update state locally
                      setNote((prevNote) => ({
                        ...prevNote,
                        collaborators: prevNote.collaborators.map((c) =>
                          c.user._id === collab.user._id
                            ? { ...c, permission: newPermission }
                            : c
                        ),
                      }));
                    } catch (err) {
                      toast.error("Failed to update permission");
                    }
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  disabled={
                    String(note.createdBy._id) !== String(currentUser._id)
                  }
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                </select>

                {/* Remove button */}
                {note.createdBy._id !== currentUser.id && (
                  <button
                    onClick={() => handleRemoveCollaborator(collab.user._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <button
          onClick={() => debouncedSave(note)}
          className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition duration-300"
        >
          Save Changes
        </button>
      </div>

      <ToastContainer />
    </div>
  );
};

export default NoteEditor;
