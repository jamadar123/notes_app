import "./App.css";
import { useState, useEffect } from "react";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNoteApi
} from "./api/noteApi";

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!title.trim() || !content.trim()) return;

    try {
      const newNote = await createNote(title, content);
      setNotes([newNote, ...notes]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditNote = async (note) => {
    const newTitle = prompt("Edit Title", note.title);
    const newContent = prompt("Edit Content", note.content);

    if (!newTitle || !newContent) return;

    try {
      const updated = await updateNote(note._id, {
        title: newTitle,
        content: newContent
      });

      setNotes(notes.map((n) => (n._id === note._id ? updated : n)));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNote = async (id) => {
    try {
      await deleteNoteApi(id);
      setNotes(notes.filter(n => n._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading"><h2>Loading...</h2></div>;

  return (
    <div className="container">
      <h1>Notes App</h1>

      {error && <div className="error-message">Error: {error} <button onClick={() => setError(null)}>ok</button></div>}

      <div className="input-group">
        <input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleAddNote}>Add</button>
      </div>

      <ul>
        {notes.map((note) => (
          <li key={note._id}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>

            <div className="actions">
              <button onClick={() => handleEditNote(note)}>
                Edit
              </button>
              <button onClick={() => deleteNote(note._id)}>
                ✖
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;