import React, { useRef, useState } from 'react';
import { FaSchool, FaGraduationCap, FaPen } from 'react-icons/fa';
import { adminUpdateStudentProfile } from '../../api/mathApi.js';
import '../../styles/AdminStudentProfile.css';

const SCHOOLS = ['School A', 'School B', 'School C'];
const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function AdminStudentProfile({ student, loading, loadError, onReload, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ school: '', grade: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const locked = useRef(false);
  const open = () => {
    setForm({ school: student.school || '', grade: student.grade || '' });
    setError(''); setNotice(''); setEditing(true);
  };
  const cancel = () => { if (!locked.current) { setEditing(false); setError(''); } };
  const save = async event => {
    event.preventDefault();
    if (locked.current || !student.id) return;
    const adminPin = localStorage.getItem('math-admin-pin');
    if (!adminPin) { setError('Please sign in as admin again before saving.'); return; }
    if (!form.school || !form.grade) { setError('Select both a school and grade level.'); return; }
    locked.current = true; setSaving(true); setError('');
    try {
      const response = await adminUpdateStudentProfile(adminPin, student.id, form);
      onUpdated(response.user);
      setEditing(false); setNotice('School and grade updated.');
    } catch (error) { setError(error?.message || 'Unable to save. Please retry.'); }
    finally { locked.current = false; setSaving(false); }
  };
  return <div className="admin-student-profile">
    <div className="admin-student-profile__details">
      <div className="admin-student-profile__field"><FaSchool aria-hidden="true" />
        <div><span>School</span><strong>{loading ? 'Loading…' : loadError ? 'Unavailable' : student.school || 'Not set'}</strong></div>
      </div>
      <div className="admin-student-profile__field"><FaGraduationCap aria-hidden="true" />
        <div><span>Grade</span><strong>{loading ? 'Loading…' : loadError ? 'Unavailable' : student.grade || 'Not set'}</strong></div>
      </div>
      {!editing && <button type="button" className="admin-student-profile__edit" onClick={open}
        disabled={loading || !!loadError || !student.id}><FaPen aria-hidden="true" /> Edit school / grade</button>}
    </div>
    {loadError && <p role="alert" className="admin-student-profile__error">{loadError} <button type="button" onClick={onReload}>Retry</button></p>}
    {notice && <p role="status" className="admin-student-profile__notice">{notice}</p>}
    {editing && <form onSubmit={save} className="admin-student-profile__form" aria-label="Edit student school and grade">
      <div className="admin-student-profile__inputs">
        <label><span>School</span><select autoFocus required value={form.school} disabled={saving}
          onChange={event => { setForm(previous => ({ ...previous, school: event.target.value })); setError(''); }}>
          <option value="" disabled>Select a school</option>
          {SCHOOLS.map(school => <option key={school}>{school}</option>)}
        </select></label>
        <label><span>Grade Level</span><select required value={form.grade} disabled={saving}
          onChange={event => { setForm(previous => ({ ...previous, grade: event.target.value })); setError(''); }}>
          <option value="" disabled>Select a grade</option>
          {GRADES.map(grade => <option key={grade}>{grade}</option>)}
        </select></label>
      </div>
      <p className="admin-student-profile__hint">Students must use the updated school and grade when signing in.</p>
      {error && <p role="alert" className="admin-student-profile__error">{error}</p>}
      <div className="admin-student-profile__actions">
        <button type="button" disabled={saving} onClick={cancel}>Cancel</button>
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>}
  </div>;
}
