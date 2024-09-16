import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

const auth = getAuth();

const Profile: React.FC = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profilePic, setProfilePic] = useState(user?.photoURL || '/default-profile.png');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setDisplayName(user?.displayName || '');
    });
    return unsubscribe;
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const storage = getStorage();
      const storageRef = ref(storage, `profilePics/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setProfilePic(downloadURL);
    }
  };

  const handleSave = async () => {
    if (user) {
      try {
        await updateProfile(user, { displayName, photoURL: profilePic });
        setEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="flex-grow overflow-y-auto p-8">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <div className="mb-4">
        <strong>Email:</strong> {user.email}
      </div>
      <div className="mb-4">
        <strong>Display Name:</strong>{' '}
        {editing ? (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-gray-700 px-2 py-1 rounded"
          />
        ) : (
          user.displayName || 'Not set'
        )}
      </div>
      <div className="mb-4">
        <strong>Profile Picture:</strong>
        <Image src={profilePic} alt="Profile" width={96} height={96} className="rounded-full mb-2" />
        {editing && (
          <input type="file" onChange={handleFileChange} accept="image/*" />
        )}
      </div>
      {editing ? (
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          Save
        </button>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
        >
          Edit
        </button>
      )}
    </div>
  );
};

export default Profile;