from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.contrib.auth.models import BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

class UserProfileManager(BaseUserManager):
    """Custom manager where email is the unique identifier for authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class UserProfile(AbstractUser):
    username = None
    phone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=('Необходимо ввести номер телефона в формате: +70123456789, '
                 'допускается до 15 знаков')
    )

    GENDER_MALE = 'm'
    GENDER_FEMALE = 'f'
    GENDER_CHOICES = (
        (GENDER_MALE, _('Male')),
        (GENDER_FEMALE, _('Female')),
    )

    ROLE_STUDENT = 's'
    ROLE_TEACHER = 't'
    ROLE_CHOICES = (
        (ROLE_STUDENT, _('Student')),
        (ROLE_TEACHER, _('Teacher')),
    )

    last_name = models.CharField(_("Фамилия"), max_length=150, blank=True)
    first_name = models.CharField(_("Имя"), max_length=150, blank=True)
    patronymic = models.CharField(_("Отчество"), max_length=150, blank=True)
    telegram = models.CharField(_("Телеграм"), max_length=128, blank=True)
    email = models.EmailField(_("Почта"), unique=True)
    date_birth = models.DateField(_("Дата рождения"), null=True)
    avatar = models.ImageField(_("Аватар"), upload_to='avatar/', blank=True, default='avatar/default.png')
    phone_number = models.CharField(_("Номер телефона"), validators=[phone_validator], max_length=17, blank=True)
    gender = models.CharField(_("Пол"), max_length=1, choices=GENDER_CHOICES, blank=True)
    role = models.CharField(_("Роль"), max_length=1, choices=ROLE_CHOICES, blank=False)
    balance = models.DecimalField(_("Баланс"), max_digits=6, decimal_places=2, default=0)
    is_active = models.BooleanField(_("Активен"), default=True, db_index=True)

    USERNAME_FIELD = 'email'  # Определяем email как основной для входа
    REQUIRED_FIELDS = []  # Убираем обязательное поле username

    objects = UserProfileManager()

    def __str__(self):
        return f'{self.email} | {self.balance}'

    def restore(self):
        self.is_active = True
        self.save()

    def delete(self, using=None, keep_parents=False):
        self.is_active = False
        self.save()