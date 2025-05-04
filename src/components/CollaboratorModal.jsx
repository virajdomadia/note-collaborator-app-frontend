import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CollaboratorModal = ({ noteId, closeModal, onCollaboratorsUpdated }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("read");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) =>
    /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);

  const handleAddCollaborator = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      // Step 1: Get user by email
      const userRes = await axios.get(
        `http://localhost:5000/api/users/email/${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userId = userRes.data._id;

      // Step 2: Share note
      await axios.post(
        `http://localhost:5000/api/notes/${noteId}/share`,
        { userId, permission },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Collaborator added successfully");
      closeModal();
      onCollaboratorsUpdated(); // Notify parent to update the collaborator list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add collaborator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Add Collaborator
        </h3>
        <form onSubmit={handleAddCollaborator} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Collaborator Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter collaborator's email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="permission"
              className="block text-sm font-medium text-gray-700"
            >
              Permission
            </label>
            <select
              id="permission"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
            </select>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={closeModal}
              className="py-2 px-6 bg-gray-300 text-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-6 bg-blue-600 text-white rounded-lg"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Collaborator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollaboratorModal;
