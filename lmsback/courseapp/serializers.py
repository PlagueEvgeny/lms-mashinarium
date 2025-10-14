from rest_framework import serializers
from courseapp.models import Category, Course, Module

# ------------------ СОЗДАТЬ ------------------
class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course 
        fields = [
            'id', 'category', 'teachers', 'name', 'slug',
            'description', 'short_description', 'image', 'price', 'status',
            'display_order','meta_title', 'meta_description', 'meta_keywords'
        ]

    def create(self, validated_data):
        course = Course.objects.create(**validated_data)
        course.save()
        return course

# ------------------ ДЕТАЛИ / СПИСОК ------------------
class CourseDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course 
        fields = [
            'id', 'category', 'teachers', 'name', 'slug',
            'description', 'short_description', 'image', 'price', 'status',
            'meta_title', 'meta_description', 'meta_keywords'
        ]
        read_only_fields = ['id', 'status', 'meta_title', 'meta_description']
