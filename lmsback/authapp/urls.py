from django.urls import path, include
from rest_framework.routers import DefaultRouter
from authapp.views import UserProfileViewSet
from authapp.views import EmailTokenObtainPairView

app_name = 'authapp'

router = DefaultRouter()
router.register(r'users', UserProfileViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('api/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),

]
