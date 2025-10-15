from django.urls import path
from courseapp.views import (
    CourseListView, CourseCreateView
)

app_name = 'courseapp'

urlpatterns = [
    path('', CourseListView.as_view(), name='course-list'),
    path('create/', CourseCreateView.as_view(), name='course-create'),
]
