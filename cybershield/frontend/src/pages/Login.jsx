import { useState } from "react" 
import { useNavigate } from "react-router-dom" 
import API from "../api/api" 
 
function Login() { 
 
   const navigate = useNavigate() 
 
   const [formData, setFormData] = useState({ 
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
         "auth/login", 
         formData 
       ) 
 
       localStorage.setItem( 
         "token", 
         response.data.access_token 
       ) 

       // Fetch user role after login
       const userResponse = await API.get("auth/me")
       localStorage.setItem("role", userResponse.data.role)
 
       alert(response.data.message) 
 
       navigate("/dashboard") 
 
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
 
         <h1 className="text-3xl font-bold"> 
           Login 
         </h1> 
 
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
           Login 
         </button> 
 
       </form> 
 
     </div> 
   ) 
 } 
 
 export default Login 
