'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [board, setBoard] = useState('');
  const [dob, setDob] = useState('');
  const [studyLanguage, setStudyLanguage] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing profile on mount
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setName(data.name || '');
          setClassName(data.class || '');
          setBoard(data.board || '');
          setDob(data.dob ? data.dob.slice(0, 10) : '');
          setStudyLanguage(data.study_language || '');
          setProfilePhotoUrl(data.profile_photo_url || '');
        }
      })
      .catch(console.error);
  }, [isSignedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !className.trim() || !board.trim()) {
      setMessage('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          class: className.trim(),
          board: board.trim(),
          dob: dob || null,
          study_language: studyLanguage.trim() || null,
          profile_photo_url: profilePhotoUrl.trim() || null,
        }),
      });
      if (res.ok) {
        setMessage('Profile saved successfully.');
      } else {
        const text = await res.text();
        setMessage(`Error: ${text}`);
      }
    } catch (err) {
      setMessage('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <main className="container mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-center">My Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border p-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Your name"
            required
          />
        </div>

        {/* Class */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Class <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. 10th, 12th"
            required
          />
        </div>

        {/* Board */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Board / Curriculum <span className="text-destructive">*</span>
          </label>
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="" disabled>Select board</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE</option>
            <option value="State Board">State Board</option>
            <option value="IB">IB</option>
            <option value="IGCSE">IGCSE</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* DOB */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Study Language */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Preferred Study Language
          </label>
          <input
            type="text"
            value={studyLanguage}
            onChange={(e) => setStudyLanguage(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. English, Hindi, Kannada"
          />
        </div>

        {/* Profile Photo URL (optional) */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Profile Photo URL
          </label>
          <input
            type="url"
            value={profilePhotoUrl}
            onChange={(e) => setProfilePhotoUrl(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {message && (
          <p className={`text-sm text-center ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}