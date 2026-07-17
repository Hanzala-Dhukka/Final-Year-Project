import { useEffect, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { getProfile, uploadAvatar, deleteAvatar } from "../../services/profileService"
import EditProfileDialog from "./EditProfileDialog"
import UploadAvatar from "./UploadAvatar"
import ProfileCard from "../../components/Profile/ProfileCard"
import ProfileStats from "../../components/Profile/ProfileStats"
import AccountInfo from "../../components/Profile/AccountInfo"

export default function Profile() {
  const { user: authUser, setUser: setAuthUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await getProfile()
      setProfile(data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile)
    setAuthUser({ ...authUser, full_name: updatedProfile.full_name })
  }

  const handleAvatarUpload = async (file) => {
    try {
      const result = await uploadAvatar(file)
      setProfile({ ...profile, profile_image: result.profile_image })
      setAuthUser({ ...authUser, profile_image: result.profile_image })
      setShowUploadDialog(false)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to upload avatar")
    }
  }

  const handleAvatarDelete = async () => {
    try {
      await deleteAvatar()
      setProfile({ ...profile, profile_image: null })
      setAuthUser({ ...authUser, profile_image: null })
    } catch (error) {
      console.error("Error deleting avatar:", error)
      alert("Failed to delete avatar")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Failed to load profile</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="mb-6">
        <ProfileCard
          profile={profile}
          authUser={authUser}
          onEdit={() => setShowEditDialog(true)}
          onUpload={() => setShowUploadDialog(true)}
        />
      </div>

      <ProfileStats profile={profile} />

      <div className="mb-6">
        <AccountInfo profile={profile} authUser={authUser} />
      </div>

      {/* Dialogs */}
      {showEditDialog && (
        <EditProfileDialog
          profile={profile}
          onClose={() => setShowEditDialog(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {showUploadDialog && (
        <UploadAvatar
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleAvatarUpload}
          onDelete={handleAvatarDelete}
          hasAvatar={!!profile.profile_image}
        />
      )}
    </div>
  )
}
