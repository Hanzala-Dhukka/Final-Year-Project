import { useEffect } from "react" 
 import API from "../api/api" 
 
 function ProfileTest() { 
 
   useEffect(() => { 
 
     const fetchProfile = async () => { 
 
       try { 
 
         const response = await API.get( 
           "auth/profile" 
         ) 
 
         console.log(response.data) 
 
       } catch (error) { 
 
         console.log(error) 
       } 
     } 
 
     fetchProfile() 
 
   }, []) 
 
   return null 
 } 
 
 export default ProfileTest
