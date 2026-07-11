import { useState } from "react"
import API from "../../api/api"

function Register() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {

    e.preventDefault()

    try {

      const response = await API.post(
        "/auth/register",
        formData
      )

      alert(response.data.message)

    } catch (error) {

      alert(error.response.data.detail)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center">

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80"
      >

        <input
          type="text"
          name="name"
          placeholder="Name"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border p-2"
          onChange={handleChange}
        />

        <button
          className="bg-black text-white p-2"
        >
          Register
        </button>

      </form>

    </div>
  )
}

export default Register
