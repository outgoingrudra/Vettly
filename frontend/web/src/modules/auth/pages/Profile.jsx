import apiRequest from "../../../services/api.js";
import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getProfileImageUrl(imagePath) {
  if (!imagePath) return "";

  // Already a complete URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Convert backend relative path into a complete URL
  const backendOrigin = new URL(API_BASE_URL).origin;

  return `${backendOrigin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}


export default function Profile() {
  const { user, logout, authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [profileImage, setProfileImage] = useState(
  getProfileImageUrl(user?.profilePicture || user?.profile_picture)
);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (profileImage?.startsWith("blob:")) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [profileImage]);


  useEffect(() => {
  const imagePath =
    user?.profilePicture || user?.profile_picture || "";

  setProfileImage(getProfileImageUrl(imagePath));
}, [user?.profilePicture, user?.profile_picture]);



  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setImageError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError("Image size must be less than 2 MB.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setProfileImage((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return previewUrl;
    });

    setSelectedFile(file);
  }


 

  const handleSavePicture = async () => {
  if (!selectedFile) {
    setImageError("Please select a picture first.");
    return;
  }

  const formData = new FormData();
  formData.append("profilePicture", selectedFile);

  try {
    setUploading(true);
    setImageError("");

    const result = await apiRequest("/auth/profile-picture", {
      method: "POST",
      body: formData,
    });

    const updatedUser = await refreshUser();

    const savedImage =
      result?.data?.profilePicture ||
      updatedUser?.profilePicture ||
      updatedUser?.profile_picture;

    if (!savedImage) {
      throw new Error(
        "Picture uploaded, but the saved image path was not returned by the profile API."
      );
    }

    setProfileImage(getProfileImageUrl(savedImage));
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    alert("Profile picture saved successfully!");
  } catch (error) {
    console.error("Profile picture upload error:", error);
    setImageError(error.message);
  } finally {
    setUploading(false);
  }
};




  function handleDeleteImage() {
    if (profileImage?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImage);
    }

    setProfileImage("");
    setSelectedFile(null);
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-300">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!user) return null;

  const name =
    user.name ?? user.fullName ?? user.full_name ?? "User";

  const email = user.email ?? "Not provided";

  const userId =
    user.id ?? user.userId ?? user.user_id ?? "Not provided";

  return (
    <AuthLayout
      title="Your Profile"
      subtitle="Manage your Vettly account and profile picture."
    >
      <div className="space-y-6">

        {/* Profile Picture */}
<div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900/50">

  {/* Profile Image */}
  <div className="relative">
    {profileImage ? (
      <img
        src={profileImage}
        alt="Profile"
        onError={() => {
          console.error("Unable to load profile image:", profileImage);
          setImageError("Unable to display profile picture.");
        }}
        className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg dark:border-slate-700"
      />
    ) : (
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-indigo-600 text-4xl font-bold text-white shadow-lg">
        {name.charAt(0).toUpperCase()}
      </div>
    )}
  </div>

  <h3 className="mt-4 text-lg font-bold">{name}</h3>

  <p className="text-sm text-slate-500 dark:text-slate-400">
    {email}
  </p>

  {/* File Input */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={handleImageChange}
    className="hidden"
  />

  {/* Buttons */}
  <div className="mt-5 flex flex-wrap justify-center gap-3">

    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      Edit Picture
    </button>

    {profileImage && (
      <button
        type="button"
        onClick={handleDeleteImage}
        className="rounded-xl border border-red-500 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Delete Picture
      </button>
    )}

    {selectedFile && (
      <button
        type="button"
        onClick={handleSavePicture}
        disabled={uploading}
        className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {uploading ? "Saving..." : "Save Picture"}
      </button>
    )}

  </div>

  <p className="mt-3 text-xs text-slate-400">
    JPG, PNG or WEBP · Maximum 2 MB
  </p>

  {imageError && (
    <p role="alert" className="mt-3 text-sm text-red-500">
      {imageError}
    </p>
  )}

  {selectedFile && (
    <p className="mt-2 text-xs text-amber-600">
      Preview only — save the picture to upload it to your account.
    </p>
  )}

</div>

        {/* Profile Details */}
        <div className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-700">

          <h3 className="font-bold">Personal Information</h3>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Full Name
            </p>
            <p className="mt-1 font-medium">{name}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Email Address
            </p>
            <p className="mt-1 break-all font-medium">{email}</p>
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Account ID
            </p>
            <p className="mt-1 break-all text-sm font-medium">
              {userId}
            </p>
             
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/sessions"
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-700"
          >
            Manage Sessions
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Log Out
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
