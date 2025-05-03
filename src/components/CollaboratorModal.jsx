import { useState } from "react";
import axios from "axios";

const CollaboratorModal = ({ noteId, closeModal }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("read");
  const [loading, setLoading] = useState(false);

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Find user by email
      const userRes = await axios.get(
        `http://localhost:5000/api/users/email/${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userId = userRes.data._id;

      // Send to share endpoint
      await axios.post(
        `http://localhost:5000/api/notes/${noteId}/share`,
        { userId, permission },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Collaborator added!");
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add collaborator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">Add Collaborator</h3>
        <form onSubmit={handleAddCollaborator} className="space-y-4">
          <input
            type="email"
            placeholder="Collaborator Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-black px-3 py-2"
            required
          />
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="w-full border border-black px-3 py-2"
          >
            <option value="read">Read</option>
            <option value="write">Write</option>
          </select>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-black rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollaboratorModal;
