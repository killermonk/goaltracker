from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.goal_list),
    url(r'^(?P<id>[0-9]+)/$', views.goal_detail),
]
