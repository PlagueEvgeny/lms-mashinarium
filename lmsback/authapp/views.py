from .models import UserProfile
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny


from rest_framework import generics, permissions, decorators, response, status, serializers
from .serializers import (
    UserProfileCreateSerializer,
    UserProfileUpdateSerializer,
    UserProfileDetailSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

class UserProfileBaseView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = UserProfile.objects.filter(is_active=True)  # только активные
        user = self.request.user
        if user.role == UserProfile.ROLE_TEACHER:
            return qs
        return qs.filter(id=user.id)


class UserProfileCreateView(UserProfileBaseView, generics.CreateAPIView):
    serializer_class = UserProfileCreateSerializer
    permission_classes = [AllowAny] 


class UserProfileListView(UserProfileBaseView, generics.ListAPIView):
    serializer_class = UserProfileDetailSerializer


class UserProfileRetrieveView(UserProfileBaseView, generics.RetrieveAPIView):
    serializer_class = UserProfileDetailSerializer
    lookup_field = 'pk'


class UserProfileUpdateView(UserProfileBaseView, generics.UpdateAPIView):
    serializer_class = UserProfileUpdateSerializer
    lookup_field = 'pk'


class UserProfilePartialUpdateView(UserProfileBaseView, generics.UpdateAPIView):
    serializer_class = UserProfileUpdateSerializer
    lookup_field = 'pk'

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class UserProfileDestroyView(UserProfileBaseView, generics.DestroyAPIView):
    lookup_field = 'pk'

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class UserProfileMeView(UserProfileBaseView, generics.RetrieveAPIView):
    serializer_class = UserProfileDetailSerializer

    def get_object(self):
        return self.request.user


class CheckEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'error': 'Email не передан'}, status=status.HTTP_400_BAD_REQUEST)

        exists = UserProfile.objects.filter(email=email).exists()
        return Response({'exists': exists})


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(request=self.context.get('request'), email=email, password=password)

        if not user:
            raise serializers.ValidationError('Неверная почта или пароль')

        data = super().validate(attrs)
        return data


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response({"detail": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist() 
        except TokenError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Успешный выход"}, status=status.HTTP_205_RESET_CONTENT)
