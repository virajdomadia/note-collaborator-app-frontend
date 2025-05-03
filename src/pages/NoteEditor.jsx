import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { debounce } from "lodash";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NoteEditor = () => {
  const { noteId } = useParams(); // ✅ Corrected from 'id' to 'noteId'
  const [note, setNote] = useState(null);
  const socketRef = useRef(null);
  const token = localStorage.getItem("token");

  // Fetch note on mount
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/notes/${noteId}`,
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

  // Setup Socket.io connection
  useEffect(() => {
    if (!noteId) return;

    socketRef.current = io("http://localhost:5000");
    socketRef.current.emit("joinNoteRoom", noteId);

    socketRef.current.on("noteUpdated", (updatedNote) => {
      if (updatedNote._id === noteId) {
        setNote(updatedNote);
        toast.info("Note updated by collaborator.");
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [noteId]);

  // Debounced autosave
  const debouncedSave = useRef(
    debounce(async (updatedNote) => {
      try {
        await axios.put(
          `http://localhost:5000/api/notes/${noteId}`,
          updatedNote,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success("Note saved");
        socketRef.current.emit("updateNote", updatedNote);
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

  if (!note) return <p>Loading note...</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h2>Note Editor</h2>

      <input
        type="text"
        value={note.title}
        onChange={handleTitleChange}
        placeholder="Note title"
        style={{ fontSize: "1.5rem", width: "100%", marginBottom: "1rem" }}
      />

      <textarea
        value={note.content}
        onChange={handleContentChange}
        placeholder="Write your note..."
        rows={15}
        style={{ width: "100%", fontSize: "1rem" }}
      />

      <div style={{ marginTop: "1rem" }}>
        <h4>Collaborators:</h4>
        <ul>
          {note.collaborators?.map((user) => (
            <li key={user._id}>
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default NoteEditor;
