from django.contrib.auth import authenticate

from rest_framework import generics, permissions, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from courseapp.models import Course
from courseapp.serializers import CourseDetailSerializer, CourseCreateSerializer


class CourseBaseView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Course.objects.filter(status=Course.Status.PUBLISHED)
        


class CourseListView(CourseBaseView, generics.ListAPIView):
    serializer_class = CourseDetailSerializer
    permission_classes = [AllowAny] 


class CourseCreateView(CourseBaseView, generics.CreateAPIView):
    serializer_class = CourseCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()