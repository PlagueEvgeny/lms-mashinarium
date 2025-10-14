from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from authapp.models import UserProfile


class Category(models.Model):
    # Основные поля
    name = models.CharField(_("Название категории"), max_length=150)
    slug = models.SlugField(_("URL"), unique=True, max_length=100)
    description = models.TextField(_("Описание категории"), blank=True)
    image = models.ImageField(_("Изображение категории"), blank=True, null=True, upload_to="course/category/")

    # SEO поля
    meta_title = models.CharField(_("Meta title"), max_length=250, blank=True)
    meta_description = models.TextField(_("Meta description"), blank=True)
    meta_keywords = models.CharField(_("Meta keywords"), max_length=500, blank=True)

    # Дополнительные поля
    created_at = models.DateTimeField(verbose_name=_("Дата создания"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("Дата обновления"), auto_now=True)
    display_order = models.IntegerField(_("Порядок отображения"), default=0)
    is_active = models.BooleanField(_("Активен"), default=True)

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT = "d", _("Черновик")
        PUBLISHED = "p", _("Опубликован")
        ARCHIVED = "a", _("Архивирован")

    # Связи с другими моделями
    category = models.ForeignKey(Category, verbose_name=_("Категория"), on_delete=models.CASCADE, related_name="courses")
    students = models.ManyToManyField(UserProfile, verbose_name=_("Студенты"), related_name="enrolled_courses", blank=True)
    teachers = models.ManyToManyField(UserProfile, verbose_name=_("Преподаватели"), related_name="teaching_courses")

    # Основные поля
    name = models.CharField(_("Название курса"), max_length=250)
    slug = models.SlugField(_("URL"), max_length=100, unique=True)
    description = models.TextField(_("Описание"))
    short_description = models.CharField(_("Краткое описание"), max_length=500, blank=True)
    image = models.ImageField(_("Изображение курса"), blank=True, null=True, upload_to="course/")
    price = models.DecimalField(_("Цена"), max_digits=8, decimal_places=2, default=0.00)

    # SEO поля
    meta_title = models.CharField(_("Meta title"), max_length=250, blank=True)
    meta_description = models.TextField(_("Meta description"), blank=True)
    meta_keywords = models.CharField(_("Meta keywords"), max_length=500, blank=True)

    # Дополнительные поля
    created_at = models.DateTimeField(verbose_name=_("Дата создания"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("Дата обновления"), auto_now=True)
    display_order = models.IntegerField(_("Порядок отображения"), default=0)
    status = models.CharField(_("Статус"), max_length=1, choices=Status.choices, default=Status.DRAFT)


    class Meta:
        verbose_name = "Курс"
        verbose_name_plural = "Курсы"
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Module(models.Model):
    # Связи с другими моделями
    course = models.ForeignKey(Course, verbose_name=_("Курс"), on_delete=models.CASCADE, related_name="modules")

    # Основные поля
    name = models.CharField(_("Название модуля"), max_length=250)
    slug = models.SlugField(_("URL"), max_length=100, unique=True)
    description = models.TextField(_("Описание"))

    # SEO поля
    meta_title = models.CharField(_("Meta title"), max_length=250, blank=True)
    meta_description = models.TextField(_("Meta description"), blank=True)
    meta_keywords = models.CharField(_("Meta keywords"), max_length=500, blank=True)

    # Дополнительные поля
    created_at = models.DateTimeField(verbose_name=_("Дата создания"), auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name=_("Дата обновления"), auto_now=True)
    display_order = models.IntegerField(_("Порядок отображения"), default=0)
    is_active = models.BooleanField(_("Активен"), default=True)


    class Meta:
        verbose_name = "Модуль"
        verbose_name_plural = "Модули"
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)