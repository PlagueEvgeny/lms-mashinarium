import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import VKLogo from '../images/vk-logo.png';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthUser } from '../hooks/useAuthUser';
import { useNavigate } from 'react-router-dom';

const MyCourse = () => {
    const { user, loading, refetch } = useAuthUser();
    const navigate = useNavigate();
    const [courses] = useState([
        { id: 1, title: 'Искусственный интеллект на Python', logo: VKLogo },
        { id: 2, title: 'Rust — основы языка программирования', logo: VKLogo },
        { id: 3, title: 'Программирование на Arduino', logo: VKLogo },
        { id: 4, title: 'Искусственный интеллект на Python', logo: VKLogo },
        { id: 5, title: 'Rust — основы языка программирования', logo: VKLogo },
        { id: 6, title: 'Программирование на Arduino', logo: VKLogo },
    ]);

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </MainLayout>
        );
    }

    if (!user) return navigate('/login');

    return (
        <MainLayout>
            <Toaster />     
                <div className="flex justify-center w-full">
                    <div className="max-w-6xl w-full px-6 py-10">
                        <h1 className="text-4xl font-bold mb-2"> {`${user.first_name} ${user.role} `} добрый день! </h1>
                        <p className="text-lg mb-8"> Сегодня отличный день, чтобы узнать новое или закрепить знания на практике. </p>
                        <h1 className="text-3xl font-bold mb-8 text-gray-800">Ваши курсы</h1>
                        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                        {courses.map((course) => (<div key={course.id}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-green-400 transition-all duration-300 p-6 cursor-pointer"
                        onClick={() => toast.success(`Открываем курс: ${course.title}`)}>
                            <div className="flex-1 pr-6">
                                <p className="text-lg font-semibold text-gray-800 mb-2">
                                    {course.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Узнай больше о курсе и начни обучение прямо сейчас.
                                </p>
                            </div>
                            <img src={course.logo} alt={course.title} className="w-32 h-32 object-contain"/>
                        </div>
                        ))}
                        </div>
                    </div>
                </div>
        </MainLayout>
    );
};

export default MyCourse;
