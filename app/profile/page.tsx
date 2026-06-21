// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';

// app/profile/page.tsx

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [board, setBoard] = useState('');
  const [studyType, setStudyType] = useState('general-studies');
  const [dob, setDob] = useState('');
  const [studyLanguage, setStudyLanguage] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
          setStudyType(data.study_type || 'general-studies');
          setDob(data.dob ? data.dob.slice(0, 10) : '');
          setStudyLanguage(data.study_language || '');
          setProfilePhotoUrl(data.profile_photo_url || '');
        }
      })
      .catch(console.error);
  }, [isSignedIn]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) {
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !className.trim() || !board.trim()) {
      setMessage('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setMessage('');

    try {
      // Upload photo first if a new file was selected
      let finalPhotoUrl = profilePhotoUrl; // use existing URL if no new file
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await fetch('/api/profile/photo', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          setMessage(`Photo upload failed: ${errText}`);
          setSaving(false);
          return;
        }
        const uploadJson = await uploadRes.json();
        finalPhotoUrl = uploadJson.url;
      }

      // Save the profile
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          class: className.trim(),
          board: board.trim(),
          study_type: studyType,
          dob: dob || null,
          study_language: studyLanguage || null,
          profile_photo_url: finalPhotoUrl || null,
        }),
      });

      if (res.ok) {
        setMessage('Profile saved successfully.');
        posthog.capture('profile_saved', {
          class: className.trim(),
          board: board.trim(),
          study_type: studyType,
        });
        // Update the current displayed URL to the new one (so preview stays correct)
        if (finalPhotoUrl !== profilePhotoUrl) {
          setProfilePhotoUrl(finalPhotoUrl);
        }
        // Clear the file input selection
        setPhotoFile(null);
        setPhotoPreview(null);
      } else {
        const text = await res.text();
        setMessage(`Error: ${text}`);
      }
    } catch (err) {
      posthog.captureException(err);
      setMessage('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }

  const currentPhotoSrc = photoPreview || profilePhotoUrl;

  return (
    <main className="container mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold">My Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border p-6">
        {/* Name */}
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Your academic name"
            required
          />
        </div>

        {/* Class */}
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Class <span className="text-destructive">*</span>
          </label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="" disabled>
              Select class
            </option>
            <option value="10th">10th</option>
            <option value="9th" disabled>
              9th
            </option>
            <option value="11th" disabled>
              11th
            </option>
            <option value="12th" disabled>
              12th
            </option>
          </select>
        </div>

        {/* Board */}
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Board <span className="text-destructive">*</span>
          </label>
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="" disabled>
              Select board
            </option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE" disabled>
              ICSE
            </option>
          </select>
        </div>

        {/* DOB */}
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {/* Profile Photo – file upload */}
        <div>
          <label className="text-muted-foreground mb-1 block text-sm font-medium">
            Profile Photo
          </label>
          {/* Show current or new preview */}
          {currentPhotoSrc && (
            <div className="mb-3 flex items-center gap-4">
              <img
                src={currentPhotoSrc}
                alt="Profile preview"
                className="h-16 w-16 rounded-full border object-cover"
              />
              <span className="text-muted-foreground text-xs">
                {photoPreview ? 'New photo selected' : 'Current photo'}
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-muted-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full cursor-pointer text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Recommended: Max 1 MB. (.jpg / .jpeg / .png)
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>

        {message && (
          <p
            className={`text-center text-sm ${message.startsWith('Error') || message.startsWith('Photo upload failed') ? 'text-destructive' : 'text-green-600'}`}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
