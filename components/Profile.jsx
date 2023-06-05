"use client"
import localFont from 'next/font/local';

const logoFont = localFont({ src: '../public/font-style.ttf' })

const Profile = () => {
  return (
    <div className="flex-center">
      <h1>"PROFILE"</h1>
    </div>
  )
}

export default Profile