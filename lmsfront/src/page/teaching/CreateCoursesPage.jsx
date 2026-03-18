import { API } from '../../services/api';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useTeacher } from '../../hooks/useTeacher';
import { Plus, FileText, Users } from 'lucide-react';

const CreateCoursesPage = () => {
  const { user } = useAuthUser();
  const { createCourse } = useTeacher();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [ fromData, setFromData ] = useState({
        name: '',
        slug: '',
        short_description: '',
        image: '',
        price: '',
        status: '', // Список
        display_order: '',
        category_ids: '', // Список
        teacher_ids: '' // Список
  })


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Toaster position="top" />
    </div>
  );
};


export default CreateCoursesPage;
