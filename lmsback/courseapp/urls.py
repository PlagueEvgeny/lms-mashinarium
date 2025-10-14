from django.urls import path
from courseapp.views import (
    CourseProfileListView, CourseCreateView
)

app_name = 'courseapp'

urlpatterns = [
    path('', CourseProfileListView.as_view(), name='course-list'),
    path('create/', CourseCreateView.as_view(), name='course-create'),
]
