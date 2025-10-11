from django.db import models
from django.utils.translation import gettext_lazy as _

class Category(models.Model):
    name = models.CharField(_("Название категории"), max_length=150)
    slug = models.SlugField(_("URL"), unique=True, max_length=100)
    descriptions = models.TextField(_("Описание категории"), blank=True)
    image = models.ImageField(_("Изображение категории"), blank=True, null=True, upload_to="course/category/")
    display_order = models.IntegerField(_("Порядок отображения"), default=0)
    is_active = models.BooleanField(_("Активна"), default=True)

    # SEO поля
    meta_title = models.CharField(_("Meta title"), max_length=250, blank=True)
    meta_descriptions = models.CharField(_("Meta descriptions"), max_length=500, blank=True)
    meta_keywords = models.CharField(_("Meta keywords"), max_length=500, blank=True)

    created_at

