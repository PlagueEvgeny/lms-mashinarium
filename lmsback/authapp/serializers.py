from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        # Можно явно перечислить поля, чтобы не вываливать всё подряд
        fields = [
            'id', 'username', 'first_name', 'last_name', 'patronymic',
            'email', 'phone_number', 'telegram', 'gender',
            'role', 'balance', 'date_birth', 'avatar', 'is_active',
        ]
        read_only_fields = ['id', 'balance', 'is_active']
