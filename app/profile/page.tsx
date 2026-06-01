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
          dob: dob || null,
          study_language: studyLanguage || null,
          profile_photo_url: finalPhotoUrl || null,
        }),
      });

      if (res.ok) {
        setMessage('Profile saved successfully.');
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

        {/* Study Language - dropdown */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Preferred Study Language
          </label>
          <select
            value={studyLanguage}
            onChange={(e) => setStudyLanguage(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>Select language</option>
            <option value="English">English</option>
            <option value="Hindi" disabled>Hindi</option>
            <option value="Bengali" disabled>Bengali</option>
            <option value="Marathi" disabled>Marathi</option>
            <option value="Telugu" disabled>Telugu</option>
            <option value="Tamil" disabled>Tamil</option>
            <option value="Gujarati" disabled>Gujarati</option>
            <option value="Urdu" disabled>Urdu</option>
            <option value="Kannada" disabled>Kannada</option>
            <option value="Odia" disabled>Odia</option>
            <option value="Malayalam" disabled>Malayalam</option>
          </select>
        </div>

        {/* Profile Photo – file upload */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Profile Photo
          </label>
          {/* Show current or new preview */}
          {currentPhotoSrc && (
            <div className="mb-3 flex items-center gap-4">
              <img
                src={currentPhotoSrc}
                alt="Profile preview"
                className="h-16 w-16 rounded-full object-cover border"
              />
              <span className="text-xs text-muted-foreground">
                {photoPreview ? 'New photo selected' : 'Current photo'}
              </span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-muted-foreground
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-medium
                       file:bg-primary file:text-primary-foreground
                       hover:file:bg-primary/90
                       cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Recommended: square image, max 5 MB. Your photo will be shown on your profile.
          </p>
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
          <p className={`text-sm text-center ${message.startsWith('Error') || message.startsWith('Photo upload failed') ? 'text-destructive' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}