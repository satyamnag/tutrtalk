// app/setting/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { usePreviewTracks } from '@livekit/components-react';
import { Track, type LocalAudioTrack } from 'livekit-client';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { MicIcon, Settings2Icon } from 'lucide-react';

// --- Pre-Join Device Testing Component (Moved from WelcomeView) ---
function PreviewTrackVisualizer({ deviceId, onDevicesFound }: { deviceId: string, onDevicesFound: (devices: MediaDeviceInfo[]) => void }) {
  // If 'default' is selected, we pass true to let the browser choose. Otherwise, we force the exact deviceId.
  const audioOptions = deviceId === 'default' ? true : { deviceId: { exact: deviceId } };
  
  const tracks = usePreviewTracks(
    { audio: audioOptions },
    (error) => { console.error('Error acquiring preview tracks:', error); }
  );
  
  const audioTrack = tracks?.find(t => t.kind === Track.Kind.Audio) as LocalAudioTrack | undefined;

  // Use native browser API to list devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const audioInputs = deviceInfos.filter((d) => d.kind === 'audioinput');
      onDevicesFound(audioInputs);
    });
  }, [onDevicesFound]);

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-xs text-muted-foreground text-center">Speak to test your mic</p>
      <AgentAudioVisualizerBar
        size="md"
        state={audioTrack ? 'speaking' : 'disconnected'}
        audioTrack={audioTrack}
        barCount={5}
        color="#1fd5f9" // Matches your app's primary accent color
        className="h-16"
      />
    </div>
  );
}

function MicTester() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('default');

  return (
    <div className="w-full space-y-4 rounded-xl border p-6 bg-card shadow-sm text-left">
      <div className="flex items-center gap-2">
        <Settings2Icon size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold">Select Microphone</h3>
      </div>
      
      {/* Native select styled exactly like the rest of the app's dropdowns */}
      <select
        value={activeDeviceId}
        onChange={(e) => setActiveDeviceId(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {devices.length === 0 && <option value="">Detecting microphones...</option>}
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
          </option>
        ))}
      </select>

      {/* Remount PreviewTrackVisualizer when device changes */}
      <PreviewTrackVisualizer key={activeDeviceId} deviceId={activeDeviceId} onDevicesFound={setDevices} />
    </div>
  );
}
// ---------------------------------------------

export default function SettingPage() {
  const { isLoaded, isSignedIn } = useUser();
  
  // We must store the full profile state to satisfy the backend's strict validation 
  // (which requires name, class, and board) when we save the settings.
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [board, setBoard] = useState('');
  const [studyType, setStudyType] = useState('general-studies');
  const [dob, setDob] = useState('');
  const [studyLanguage, setStudyLanguage] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // We send the FULL profile payload to strictly satisfy the backend validation
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          class: className,
          board,
          study_type: studyType,
          dob: dob || null,
          study_language: studyLanguage || null,
          profile_photo_url: profilePhotoUrl || null,
        }),
      });

      if (res.ok) {
        setMessage('Settings saved successfully.');
      } else {
        const text = await res.text();
        setMessage(`Error: ${text}`);
      }
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading…</div>;
  }
  if (!isSignedIn) {
    return <div className="flex h-screen items-center justify-center">Please sign in.</div>;
  }

  return (
    <main className="container mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold text-center">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border p-6">
        {/* Study Type */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Study Type <span className="text-destructive">*</span>
          </label>
          <select
            value={studyType}
            onChange={(e) => setStudyType(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="competitive-exams" disabled>
              Competitive Exams
            </option>
            <option value="general-studies">General Studies</option>
            <option value="school-exams" disabled>
              School Exams
            </option>
          </select>
        </div>

        {/* Study Language */}
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

        {/* Appearance / Theme */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Appearance
          </label>
          <div className="flex items-center gap-4">
            <ThemeToggle className="w-auto" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Choose how TutrTalk looks on your device.
          </p>
        </div>

        {/* NEW: Test Microphone Section */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Audio Setup
          </label>
          <MicTester />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
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