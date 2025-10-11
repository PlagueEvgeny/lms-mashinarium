from django.urls import path
from authapp.views import (
    UserProfileCreateView,
    UserProfileListView,
    UserProfileRetrieveView,
    UserProfileUpdateView,
    UserProfilePartialUpdateView,
    UserProfileDestroyView,
    UserProfileMeView,
    EmailTokenObtainPairView,
    LogoutView,
    CheckEmailView
)

app_name = 'authapp'

urlpatterns = [
    path('users/', UserProfileListView.as_view(), name='user-list'),
    path('users/create/', UserProfileCreateView.as_view(), name='user-create'),
    path('users/<int:pk>/', UserProfileRetrieveView.as_view(), name='user-detail'),
    path('users/<int:pk>/update/', UserProfileUpdateView.as_view(), name='user-update'),
    path('users/<int:pk>/partial-update/', UserProfilePartialUpdateView.as_view(), name='user-partial-update'),
    path('users/<int:pk>/delete/', UserProfileDestroyView.as_view(), name='user-delete'),

    path('users/me/', UserProfileMeView.as_view(), name='user-me'),
    path('users/check_email/', CheckEmailView.as_view(), name='check-email'),
    path('api/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
]
