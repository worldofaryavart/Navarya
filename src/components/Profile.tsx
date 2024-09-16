"use client"
import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { FiEdit2, FiSave, FiUpload } from 'react-icons/fi';
import { motion } from 'framer-motion';

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
    <div className="flex-grow overflow-y-auto p-8 flex justify-center items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">User Profile</h2>
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Image
              src={profilePic}
              alt="Profile"
              width={128}
              height={128}
              className="rounded-full border-4 border-blue-500 shadow-lg"
            />
            {editing && (
              <label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                <FiUpload className="text-white" />
                <input
                  id="profile-pic-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <div className="bg-gray-700 px-3 py-2 rounded-md">{user.email}</div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
          {editing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-gray-700 px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="bg-gray-700 px-3 py-2 rounded-md">{user.displayName || 'Not set'}</div>
          )}
        </div>
        <div className="flex justify-center">
          {editing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-md flex items-center space-x-2 transition-colors"
            >
              <FiSave />
              <span>Save</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(true)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-2 rounded-md flex items-center space-x-2 transition-colors"
            >
              <FiEdit2 />
              <span>Edit</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;