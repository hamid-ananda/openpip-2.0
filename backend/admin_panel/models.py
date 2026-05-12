from django.db import models


class AdminSettings(models.Model):
    title = models.CharField(max_length=200, null=True)
    short_title = models.CharField(max_length=200, null=True)
    url = models.CharField(max_length=200, null=True)
    version = models.CharField(max_length=200, null=True)
    home_page = models.TextField(null=True)
    mission_title = models.TextField(null=True)
    mission_text = models.TextField(null=True)
    method_title = models.TextField(null=True)
    method_text = models.TextField(null=True)
    about = models.TextField(null=True)
    faq = models.TextField(null=True)
    download = models.TextField(null=True)
    contact = models.TextField(null=True)
    show_downloads = models.BooleanField(default=False)
    show_download_all = models.BooleanField(default=False)
    footer = models.TextField(null=True)
    main_color_scheme = models.CharField(max_length=10, null=True)
    header_color_scheme = models.CharField(max_length=10, null=True)
    logo_color_scheme = models.CharField(max_length=10, null=True)
    button_color_scheme = models.CharField(max_length=10, null=True)
    logo = models.FileField(upload_to="logos/", null=True, blank=True)
    nav_style = models.CharField(max_length=20, default="solid", null=True, blank=True)
    main_color_scheme_2 = models.CharField(max_length=20, null=True, blank=True)
    gradient_angle = models.IntegerField(default=135, null=True, blank=True)
    example_1 = models.CharField(max_length=100, null=True)
    example_2 = models.CharField(max_length=100, null=True)
    example_3 = models.CharField(max_length=100, null=True)
    query_node_color = models.CharField(max_length=20, null=True)
    interactor_node_color = models.CharField(max_length=20, null=True)
    published_edge_color = models.CharField(max_length=20, null=True)
    validated_edge_color = models.CharField(max_length=20, null=True)
    verified_edge_color = models.CharField(max_length=20, null=True)
    literature_edge_color = models.CharField(max_length=20, null=True)

    class Meta:
        db_table = "admin_settings"
        verbose_name_plural = "admin settings"

    def __str__(self):
        return self.title or "AdminSettings"


class Announcement(models.Model):
    title = models.CharField(max_length=100)
    text = models.CharField(max_length=4000)
    date = models.DateTimeField(null=True)
    show = models.BooleanField(default=True)
    show_on_home_page = models.BooleanField(default=True)

    class Meta:
        db_table = "announcement"

    def __str__(self):
        return self.title
