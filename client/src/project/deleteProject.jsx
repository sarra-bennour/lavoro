import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from "sweetalert2";
import 'bootstrap/dist/css/bootstrap.min.css';



const deleteProject  = async (projectId) => {


      const [projects, setProjects] = useState([]);
      
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`https://lavoro-back.onrender.com/project/deleteProject/${projectId}`, {
            method: "DELETE",
          });
  
          if (!response.ok) {
            throw new Error("Failed to delete project");
          }
  
          Swal.fire("Deleted!", "Your project has been deleted.", "success");
  
          // Mettre à jour la liste après suppression
          setProjects((prevProjects) => prevProjects.filter((project) => project._id !== projectId));
  
        } catch (error) {
          console.error("Error deleting project:", error);
          Swal.fire("Error!", "There was an issue deleting the project.", "error");
        }
      }
    });
  };

  export default deleteProject;