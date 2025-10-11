from rest_framework import serializers
from .models import UserProfile

# ------------------ CREATE ------------------
class UserProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'email', 'first_name', 'last_name', 'patronymic',
            'password', 'date_birth', 'phone_number', 
            'telegram', 'avatar'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = UserProfile.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ------------------ UPDATE ------------------
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'patronymic',
            'date_birth', 'phone_number', 'gender', 
            'telegram',  'avatar'
        ]


# ------------------ DETAIL / LIST ------------------
class UserProfileDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'email', 'first_name', 'last_name', 'patronymic',
            'phone_number', 'telegram', 'gender', 'role', 'balance',
            'date_birth', 'avatar', 'is_active'
        ]
        read_only_fields = ['id', 'email', 'balance', 'is_active']
