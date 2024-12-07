import Profile from "@/components/Profile";
import React from "react";

const ProfilePage: React.FC = () => {
  return (
    <div className="container h-screen mx-auto px-4 py-12 bg-gray-900 text-white overflow-y-auto">
      <Profile />
    </div>
  );
};

export default ProfilePage;
